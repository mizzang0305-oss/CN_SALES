import { extractPartCodeFromText, normalizePartCode } from "@/lib/import/master-data";
import type { OperationalPreviewSummary } from "@/lib/import/preview-checksum";
import type { ImportPreviewRecord } from "@/lib/import/types";

export const salesImportPreviewParts = ["1", "4", "5", "6", "7", "9", "10", "11"] as const;

export type SalesImportPreviewRole =
  | "SALES_REP_PART_1"
  | "SALES_REP_PART_4"
  | "SALES_REP_PART_5"
  | "SALES_REP_PART_6"
  | "SALES_REP_PART_7"
  | "SALES_REP_PART_9"
  | "SALES_REP_PART_10"
  | "SALES_REP_PART_11"
  | "PART_LEAD"
  | "ADMIN";

export type SalesImportPreviewAccessResult = {
  ok: boolean;
  role: SalesImportPreviewRole | "";
  partCode: string;
  allowedParts: string[];
  blockedReasons: string[];
};

export type SalesImportPreviewResponse = {
  ok: true;
  fileName: string;
  fileHash: string;
  part: string;
  selectedPart: string;
  filePart: string | null;
  periodStart: string;
  periodEnd: string;
  normalRows: number;
  excludedRows: number;
  amountTotal: number;
  warningRows: number;
  errorRows: number;
  rawRowsReturned: false;
  permission: {
    role: SalesImportPreviewRole | "";
    allowedParts: string[];
    crossPartBlocked: false;
  };
  sideEffects: {
    dbWrite: false;
    storageWrite: false;
    sync: false;
    apply: false;
  };
  blockedReasons: string[];
  warnings: string[];
};

const salesImportPreviewRoleSet = new Set<string>([
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
]);

export function normalizeSalesImportPreviewRole(value?: string | null): SalesImportPreviewRole | "" {
  const normalized = String(value ?? "").trim().toUpperCase();
  return salesImportPreviewRoleSet.has(normalized) ? (normalized as SalesImportPreviewRole) : "";
}

export function parseManagedPartCodes(value?: string | null): string[] {
  const parts = String(value ?? "")
    .split(/[,\s]+/)
    .map((part) => normalizePartCode(part))
    .filter((part) => isSalesImportPreviewPart(part));
  return uniqueStrings(parts);
}

export function getSalesImportPreviewAllowedParts(roleInput?: string | null, managedParts: string[] = []) {
  const role = normalizeSalesImportPreviewRole(roleInput);
  if (role === "ADMIN") return [...salesImportPreviewParts];
  if (role === "PART_LEAD") return uniqueStrings(managedParts.filter((part) => isSalesImportPreviewPart(part)));

  const salesRepPart = role.match(/^SALES_REP_PART_(\d+)$/)?.[1] ?? "";
  return isSalesImportPreviewPart(salesRepPart) ? [salesRepPart] : [];
}

export function validateSalesImportPreviewAccess(input: {
  role?: string | null;
  partCode?: string | null;
  managedParts?: string[];
}): SalesImportPreviewAccessResult {
  const role = normalizeSalesImportPreviewRole(input.role);
  const partCode = normalizePartCode(input.partCode);
  const allowedParts = getSalesImportPreviewAllowedParts(role, input.managedParts ?? []);

  if (!role) {
    return { ok: false, role, partCode, allowedParts, blockedReasons: ["ROLE_REQUIRED"] };
  }

  if (!isSalesImportPreviewPart(partCode)) {
    return { ok: false, role, partCode, allowedParts, blockedReasons: ["PART_REQUIRED"] };
  }

  if (!allowedParts.includes(partCode)) {
    return { ok: false, role, partCode, allowedParts, blockedReasons: ["PART_SCOPE_FORBIDDEN"] };
  }

  return { ok: true, role, partCode, allowedParts, blockedReasons: [] };
}

export function isSupportedSalesImportPreviewFile(fileName: string, options: { allowJsonFixture?: boolean } = {}) {
  const allowed = options.allowJsonFixture ? /\.(xls|xlsx|json)$/i : /\.(xls|xlsx)$/i;
  return allowed.test(fileName);
}

export function deriveSalesImportPreviewPeriod(input: {
  fileName?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  periodMonth?: string | null;
}) {
  const directStart = normalizeIsoDate(input.periodStart);
  const directEnd = normalizeIsoDate(input.periodEnd);
  if (directStart && directEnd) return { periodStart: directStart, periodEnd: directEnd };

  const month = normalizePeriodMonth(input.periodMonth) ?? "2026-06";
  const fileRange = String(input.fileName ?? "").match(/(\d{1,2})\s*(?:~|-|to)\s*(\d{1,2})\s*(?:\uC77C|day)?/i);
  if (fileRange) {
    const startDay = Number(fileRange[1]);
    const endDay = Number(fileRange[2]);
    if (isValidDay(startDay) && isValidDay(endDay) && startDay <= endDay) {
      return {
        periodStart: `${month}-${String(startDay).padStart(2, "0")}`,
        periodEnd: `${month}-${String(endDay).padStart(2, "0")}`,
      };
    }
  }

  return {
    periodStart: directStart ?? `${month}-01`,
    periodEnd: directEnd ?? `${month}-30`,
  };
}

export function resolveSalesImportPreviewPart(input: {
  selectedPartCode?: string | null;
  fileName?: string | null;
  preview?: ImportPreviewRecord | null;
  operationalSummary?: OperationalPreviewSummary | null;
}) {
  const filePart = extractPartCodeFromText(input.fileName);
  const selectedPart = normalizePartCode(input.selectedPartCode);
  const summaryPart = normalizePartCode(input.operationalSummary?.selectedPartCode ?? input.preview?.summary.partCode);
  const part = filePart || summaryPart || selectedPart;

  return {
    part,
    selectedPart,
    filePart: filePart || null,
  };
}

export function createSalesImportPreviewResponse(input: {
  preview: ImportPreviewRecord;
  operationalSummary: OperationalPreviewSummary;
  fileHash: string;
  access: SalesImportPreviewAccessResult;
  selectedPart: string;
  filePart: string | null;
}): SalesImportPreviewResponse {
  return {
    ok: true,
    fileName: input.preview.summary.fileName,
    fileHash: input.fileHash,
    part: input.access.partCode,
    selectedPart: input.selectedPart,
    filePart: input.filePart,
    periodStart: input.preview.summary.periodStart,
    periodEnd: input.preview.summary.periodEnd,
    normalRows: input.operationalSummary.normalRows,
    excludedRows: input.operationalSummary.excludedRows,
    amountTotal: input.operationalSummary.amountTotal,
    warningRows: input.operationalSummary.warningRows,
    errorRows: input.operationalSummary.errorRows,
    rawRowsReturned: false,
    permission: {
      role: input.access.role,
      allowedParts: input.access.allowedParts,
      crossPartBlocked: false,
    },
    sideEffects: {
      dbWrite: false,
      storageWrite: false,
      sync: false,
      apply: false,
    },
    blockedReasons: input.preview.blockedReasons,
    warnings: input.operationalSummary.warnings,
  };
}

function normalizeIsoDate(value?: string | null) {
  const normalized = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function normalizePeriodMonth(value?: string | null) {
  const normalized = String(value ?? "").trim();
  return /^\d{4}-\d{2}$/.test(normalized) ? normalized : null;
}

function isValidDay(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 31;
}

function isSalesImportPreviewPart(value: string): value is (typeof salesImportPreviewParts)[number] {
  return salesImportPreviewParts.includes(value as (typeof salesImportPreviewParts)[number]);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
