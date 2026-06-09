import type { LedgerRawRow } from "@/lib/types";

export const PART_REQUIRED = "PART_REQUIRED";

const partColumnKeys = ["part_code", "part", "part_name", "sales_part", "team", "department", "파트", "부서", "팀"];

export function resolveImportPartCode(input: {
  selectedPartCode?: string | null;
  fileName: string;
  rows: LedgerRawRow[];
}) {
  const selected = normalizePartCode(input.selectedPartCode);
  if (selected) return { partCode: selected, source: "selected" as const, blockedReasons: [] };

  const fromFileName = extractPartCodeFromText(input.fileName);
  if (fromFileName) return { partCode: fromFileName, source: "file_name" as const, blockedReasons: [] };

  for (const row of input.rows) {
    const fromRow = normalizePartCodeFromRow(row);
    if (fromRow) return { partCode: fromRow, source: "ledger_row" as const, blockedReasons: [] };
  }

  return { partCode: "", source: "missing" as const, blockedReasons: [PART_REQUIRED] };
}

export function normalizePartCode(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  const text = String(value).normalize("NFKC").trim();
  if (!text) return "";

  const koreanPart = text.match(/(\d+)\s*파트/i);
  if (koreanPart) return koreanPart[1];

  const asciiPart = text.match(/\bpart[-_\s]*(\d+|[a-z])\b/i);
  if (asciiPart) return asciiPart[1].toUpperCase();

  return text.replace(/\s+/g, "").toUpperCase();
}

function extractPartCodeFromText(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  const text = String(value).normalize("NFKC").trim();
  if (!text) return "";

  const koreanPart = text.match(/(\d+)\s*파트/i);
  if (koreanPart) return koreanPart[1];

  const asciiPart = text.match(/\bpart[-_\s]*(\d+|[a-z])\b/i);
  if (asciiPart) return asciiPart[1].toUpperCase();

  return "";
}

export function normalizeMasterName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function defaultPartName(partCode: string) {
  return `${partCode}파트`;
}

export function classifyUsageStatus(input: {
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  referenceDate: string | null;
}) {
  if (!input.lastPurchaseDate || !input.referenceDate) return "active";

  const firstAge = input.firstPurchaseDate ? daysBetween(input.firstPurchaseDate, input.referenceDate) : null;
  const lastAge = daysBetween(input.lastPurchaseDate, input.referenceDate);

  if (firstAge !== null && firstAge <= 14) return "new";
  if (lastAge <= 30) return "active";
  if (lastAge <= 60) return "churn_watch";
  if (lastAge <= 90) return "churn_risk";
  return "churned";
}

function normalizePartCodeFromRow(row: LedgerRawRow) {
  for (const key of partColumnKeys) {
    const value = row[key];
    const partCode = normalizePartCode(typeof value === "string" || typeof value === "number" ? value : null);
    if (partCode) return partCode;
  }
  return "";
}

function daysBetween(leftDate: string, rightDate: string) {
  const left = Date.parse(leftDate);
  const right = Date.parse(rightDate);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return Number.POSITIVE_INFINITY;
  return Math.floor((right - left) / 86_400_000);
}
