import { createHash } from "node:crypto";
import { extractPartCodeFromText, getSelectedFilePartMismatch } from "@/lib/import/master-data";
import type { ImportPreviewRecord } from "@/lib/import/types";
import type { RowIssueReasonCounts } from "@/lib/types";

export type OperationalPreviewSummary = {
  totalRows: number;
  normalRows: number;
  excludedRows: number;
  warningRows: number;
  errorRows: number;
  excludedOrErrorRows: number;
  excludedByReason: RowIssueReasonCounts;
  warningByReason: RowIssueReasonCounts;
  errorByReason: RowIssueReasonCounts;
  partMismatch: boolean;
  selectedPartCode: string;
  filePartCode: string | null;
  amountTotal: number;
  salesTotal: number;
  receiptTotal: number;
  customerCount: number;
  productCount: number;
  warnings: string[];
};

export type PreviewChecksumInput = {
  sourceFileHash: string;
  preview: ImportPreviewRecord;
  operationalSummary: OperationalPreviewSummary;
};

export async function hashUploadFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    buffer,
    sourceFileHash: hashBytes(buffer),
  };
}

export function hashBytes(bytes: Buffer | string) {
  const hash = createHash("sha256");
  hash.end(bytes);
  return `sha256:${hash.digest("hex")}`;
}

export function toOperationalPreviewSummary(preview: ImportPreviewRecord, envBlockedReasons: string[] = []): OperationalPreviewSummary {
  const customerNames = new Set(preview.rows.map((row) => row.customerName?.trim()).filter(Boolean));
  const productNames = new Set(preview.rows.map((row) => row.productName?.trim()).filter(Boolean));
  const partMismatch = getSelectedFilePartMismatch({
    selectedPartCode: preview.summary.partCode,
    fileName: preview.summary.fileName,
  });
  const warnings = uniqueStrings([
    ...preview.blockedReasons,
    ...envBlockedReasons,
    ...(partMismatch ? [partMismatch.code] : []),
    ...(preview.summary.errorRows > 0 ? ["PREVIEW_HAS_ERROR_ROWS"] : []),
    ...(preview.summary.warningRows > 0 ? ["PREVIEW_HAS_WARNING_ROWS"] : []),
    ...(preview.summary.excludedRows > 0 ? ["PREVIEW_HAS_EXCLUDED_ROWS"] : []),
    ...(preview.summary.skippedRows > 0 ? ["DUPLICATE_OR_SKIPPED_ROWS_PRESENT"] : []),
  ]);

  return {
    totalRows: preview.summary.totalRows,
    normalRows: Math.max(preview.summary.parsableRows - preview.summary.warningRows - preview.summary.errorRows, 0),
    excludedRows: preview.summary.excludedRows,
    warningRows: preview.summary.warningRows,
    errorRows: preview.summary.errorRows,
    excludedOrErrorRows: preview.summary.skippedRows + preview.summary.excludedRows + preview.summary.warningRows + preview.summary.errorRows,
    excludedByReason: preview.summary.excludedByReason,
    warningByReason: preview.summary.warningByReason,
    errorByReason: preview.summary.errorByReason,
    partMismatch: Boolean(partMismatch),
    selectedPartCode: preview.summary.partCode,
    filePartCode: partMismatch?.filePartCode ?? extractPartCodeFromText(preview.summary.fileName),
    amountTotal: preview.summary.salesTotal + preview.summary.receiptTotal,
    salesTotal: preview.summary.salesTotal,
    receiptTotal: preview.summary.receiptTotal,
    customerCount: customerNames.size,
    productCount: productNames.size,
    warnings,
  };
}

export function createPreviewChecksum(input: PreviewChecksumInput) {
  const payload = {
    version: 1,
    sourceFileHash: input.sourceFileHash,
    selectedPartCode: input.operationalSummary.selectedPartCode,
    filePartCode: input.operationalSummary.filePartCode,
    totalRows: input.operationalSummary.totalRows,
    normalRows: input.operationalSummary.normalRows,
    excludedRows: input.operationalSummary.excludedRows,
    warningRows: input.operationalSummary.warningRows,
    errorRows: input.operationalSummary.errorRows,
    excludedOrErrorRows: input.operationalSummary.excludedOrErrorRows,
    excludedByReason: sortRecord(input.operationalSummary.excludedByReason),
    warningByReason: sortRecord(input.operationalSummary.warningByReason),
    errorByReason: sortRecord(input.operationalSummary.errorByReason),
    amountTotal: input.operationalSummary.amountTotal,
    salesTotal: input.operationalSummary.salesTotal,
    receiptTotal: input.operationalSummary.receiptTotal,
    customerCount: input.operationalSummary.customerCount,
    productCount: input.operationalSummary.productCount,
    rowTypeCounts: sortRecord(input.preview.rowTypeCounts),
    rowHashes: input.preview.rows
      .map((row) => ({
        rowIndex: row.rowIndex,
        rowType: row.rowType,
        partCode: row.partCode,
        ledgerDate: row.ledgerDate,
        action: row.action,
        identityHash: row.identityHash,
        contentHash: row.contentHash,
        errorCount: row.errors.length,
      }))
      .sort((left, right) => left.rowIndex - right.rowIndex),
    warnings: [...input.operationalSummary.warnings].sort(),
  };

  return hashBytes(stableStringify(payload));
}

export function getApplyDisabledReason(preview: ImportPreviewRecord, status: { canWrite?: boolean }, partMismatch: boolean) {
  if (partMismatch) return "PART_FILE_MISMATCH";
  if (!status.canWrite) return "PREVIEW_ONLY";
  if (preview.summary.errorRows > 0) return "HAS_ERROR_ROWS";
  if (preview.summary.warningRows > 0) return "HAS_WARNING_ROWS";
  if (!preview.summary.canCommit) return "PREVIEW_NOT_COMMITTABLE";
  return null;
}

export function getConfirmBlockedReason(operationalSummary: OperationalPreviewSummary) {
  if (operationalSummary.partMismatch) return "PART_FILE_MISMATCH";
  return null;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function sortRecord(record: Record<string, number | undefined>) {
  return Object.fromEntries(
    Object.entries(record)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number")
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}
