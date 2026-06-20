import { extractPartCodeFromText, normalizePartCode } from "@/lib/import/master-data";
import type { OperationalPreviewSummary } from "@/lib/import/preview-checksum";
import type { ImportPreviewRecord } from "@/lib/import/types";
import type { SalesImportRole, SalesPartAccessResult } from "@/lib/auth/part-access";

export {
  getAllowedSalesPartsForRole as getSalesImportPreviewAllowedParts,
  normalizeSalesImportRole as normalizeSalesImportPreviewRole,
  parseManagedPartCodes,
  supportedSalesPartCodes as salesImportPreviewParts,
  validateSalesPartAccess as validateSalesImportPreviewAccess,
} from "@/lib/auth/part-access";

export type SalesImportPreviewRole = SalesImportRole;
export type SalesImportPreviewAccessResult = SalesPartAccessResult;

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
    role: SalesImportRole | "";
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
  const filenamePeriod = deriveSalesImportFilenamePeriod({ fileName: input.fileName, periodMonth: month });
  if (filenamePeriod) return filenamePeriod;

  return {
    periodStart: directStart ?? `${month}-01`,
    periodEnd: directEnd ?? `${month}-30`,
  };
}

export function deriveSalesImportFilenamePeriod(input: { fileName?: string | null; periodMonth?: string | null }) {
  const month = normalizePeriodMonth(input.periodMonth) ?? "2026-06";
  const fileRange = String(input.fileName ?? "").match(/(\d{1,2})\s*(?:~|-|to)\s*(\d{1,2})\s*(?:\uC77C|day)?/i);
  if (!fileRange) return null;

  const startDay = Number(fileRange[1]);
  const endDay = Number(fileRange[2]);
  if (!isValidDay(startDay) || !isValidDay(endDay) || startDay > endDay) return null;

  return {
    periodStart: `${month}-${String(startDay).padStart(2, "0")}`,
    periodEnd: `${month}-${String(endDay).padStart(2, "0")}`,
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
