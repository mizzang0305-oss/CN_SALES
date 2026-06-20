import { normalizePartCode } from "@/lib/import/master-data";

export const supportedSalesPartCodes = ["1", "4", "5", "6", "7", "9", "10", "11"] as const;

export const salesImportRoles = [
  "SALES_REP_PART_1",
  "SALES_REP_PART_4",
  "SALES_REP_PART_5",
  "SALES_REP_PART_6",
  "SALES_REP_PART_7",
  "SALES_REP_PART_9",
  "SALES_REP_PART_10",
  "SALES_REP_PART_11",
  "PART_LEAD",
  "ADMIN",
] as const;

export type SalesImportRole = (typeof salesImportRoles)[number];

export type SalesPartAccessResult = {
  ok: boolean;
  role: SalesImportRole | "";
  partCode: string;
  allowedParts: string[];
  blockedReasons: string[];
};

const salesImportRoleSet = new Set<string>(salesImportRoles);

export function normalizeSalesImportRole(value?: string | null): SalesImportRole | "" {
  const normalized = String(value ?? "").trim().toUpperCase();
  return salesImportRoleSet.has(normalized) ? (normalized as SalesImportRole) : "";
}

export function parseManagedPartCodes(value?: string | null): string[] {
  const parts = String(value ?? "")
    .split(/[,\s]+/)
    .map((part) => normalizePartCode(part))
    .filter((part) => isSupportedSalesPartCode(part));
  return uniqueStrings(parts);
}

export function getAllowedSalesPartsForRole(roleInput?: string | null, managedParts: string[] = []) {
  const role = normalizeSalesImportRole(roleInput);
  if (role === "ADMIN") return [...supportedSalesPartCodes];
  if (role === "PART_LEAD") return uniqueStrings(managedParts.filter((part) => isSupportedSalesPartCode(part)));

  const salesRepPart = role.match(/^SALES_REP_PART_(\d+)$/)?.[1] ?? "";
  return isSupportedSalesPartCode(salesRepPart) ? [salesRepPart] : [];
}

export function canAccessSalesPart(input: {
  role?: string | null;
  requestedPart?: string | null;
  managedParts?: string[];
}) {
  return validateSalesPartAccess({
    role: input.role,
    partCode: input.requestedPart,
    managedParts: input.managedParts,
  }).ok;
}

export function validateSalesPartAccess(input: {
  role?: string | null;
  partCode?: string | null;
  managedParts?: string[];
}): SalesPartAccessResult {
  const role = normalizeSalesImportRole(input.role);
  const partCode = normalizePartCode(input.partCode);
  const allowedParts = getAllowedSalesPartsForRole(role, input.managedParts ?? []);

  if (!role) {
    return { ok: false, role, partCode, allowedParts, blockedReasons: ["ROLE_REQUIRED"] };
  }

  if (!isSupportedSalesPartCode(partCode)) {
    return { ok: false, role, partCode, allowedParts, blockedReasons: ["PART_UNSUPPORTED"] };
  }

  if (!allowedParts.includes(partCode)) {
    return { ok: false, role, partCode, allowedParts, blockedReasons: ["PART_SCOPE_FORBIDDEN"] };
  }

  return { ok: true, role, partCode, allowedParts, blockedReasons: [] };
}

export function isSupportedSalesPartCode(value?: string | null): value is (typeof supportedSalesPartCodes)[number] {
  const partCode = normalizePartCode(value);
  return supportedSalesPartCodes.includes(partCode as (typeof supportedSalesPartCodes)[number]);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
