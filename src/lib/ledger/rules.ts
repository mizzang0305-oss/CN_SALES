import { stableHash } from "@/lib/ledger/hash";
import { normalizeLedgerDate, type LedgerDateIssue } from "@/lib/import/ledger-date-normalization";
import { isCommittablePreviewRow, summarizeRowIssues } from "@/lib/import/row-classification";
import type { ImportAction, LedgerRawRow, LedgerRowType, ParsedLedgerRow } from "@/lib/types";

const emptyRow: LedgerRawRow = {};
const labelKeys = ["구분", "구분(내용)", "row_type", "품명", "상품명", "상  품  명", "상 품 명"];
const dateKeys = ["일자", "날짜", "거래일자", "date"];
const customerCodeKeys = ["거래처코드", "관리코드(C)", "customer_code", "코드", "ccode"];
const customerNameKeys = ["거래처명", "customer_name", "거래처"];
const productNameKeys = ["상품명", "품명", "상  품  명", "상 품 명", "product_name"];
const quantityKeys = ["수량", "quantity"];
const unitPriceKeys = ["단가", "unit_price"];
const salesAmountKeys = ["매출액", "금액", "합계액", "공급가액", "sales_amount", "amount"];
const receiptAmountKeys = ["입금액", "회입액", "receipt_amount"];
const receiptDiscountKeys = ["입금할인", "회입할인", "할인", "receipt_discount"];
const receiptTotalKeys = ["입금+할인"];
const arBalanceKeys = ["외상잔액", "잔액", "ar_balance"];

export function classifyLedgerRow(rawRowJson: LedgerRawRow = emptyRow): LedgerRowType {
  const label = getText(rawRowJson, labelKeys);
  const productName = getText(rawRowJson, productNameKeys);
  const quantity = getNumber(rawRowJson, quantityKeys);
  const unitPrice = getNumber(rawRowJson, unitPriceKeys);
  const salesAmount = getNumber(rawRowJson, salesAmountKeys);
  const receiptAmount = getNumber(rawRowJson, [...receiptAmountKeys, ...receiptTotalKeys]);

  if (/총계|합계계|grand/i.test(label)) return "grand_total";
  if (/일계|daily/i.test(label)) return "daily_total";
  if (/거래처계|거래처합계|customer.?total/i.test(label)) return "customer_total";
  if (/입금|회입|receipt/i.test(label) || (!productName && receiptAmount !== 0)) return "receipt";

  if (productName && (quantity !== 0 || unitPrice !== 0 || salesAmount !== 0)) {
    return "item_detail";
  }

  return "unknown";
}

export function parseLedgerRows(input: {
  rows: LedgerRawRow[];
  partCode: string;
  periodStart: string;
  periodEnd: string;
  existingHashes?: Record<string, string>;
}) {
  let carryForwardDate: string | null = null;
  return input.rows.map((rawRowJson, index) => {
    const row = normalizeLedgerRow({
      rawRowJson,
      rowIndex: index + 1,
      partCode: input.partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      carryForwardDate,
    });
    if (row.ledgerDate && !row.ledgerDateIssue) {
      carryForwardDate = row.ledgerDate;
    }
    const previousContentHash = input.existingHashes?.[row.identityHash];
    const action: ImportAction = row.errors.length
      ? "error"
      : !previousContentHash
        ? "insert"
        : previousContentHash === row.contentHash
          ? "skipped"
          : "update";

    return { ...row, action };
  });
}

export function normalizeLedgerRow(input: {
  rawRowJson: LedgerRawRow;
  rowIndex: number;
  partCode: string;
  periodStart: string;
  periodEnd: string;
  carryForwardDate?: string | null;
}): ParsedLedgerRow {
  const rawRowJson = input.rawRowJson;
  const rowType = classifyLedgerRow(rawRowJson);
  let normalizedLedgerDate = normalizeLedgerDate(getValue(rawRowJson, dateKeys), {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
  });
  const ledgerDateWasCarriedForward = shouldCarryForwardLedgerDate(rowType, normalizedLedgerDate.reason)
    && Boolean(input.carryForwardDate);
  if (ledgerDateWasCarriedForward && input.carryForwardDate) {
    normalizedLedgerDate = {
      ok: true,
      isoDate: input.carryForwardDate,
      formatCategory: "yyyy-mm-dd",
      changedToIso: false,
      reason: null,
    };
  }
  const ledgerDate = normalizedLedgerDate.isoDate ?? "";
  const customerCode = getText(rawRowJson, customerCodeKeys) || null;
  const customerName = getText(rawRowJson, customerNameKeys) || null;
  const productName = getText(rawRowJson, productNameKeys) || null;
  const quantity = getNumber(rawRowJson, quantityKeys);
  const unitPrice = getNumber(rawRowJson, unitPriceKeys);
  const salesAmount = getNumber(rawRowJson, salesAmountKeys);
  const receiptAmount = getNumber(rawRowJson, receiptAmountKeys) || getNumber(rawRowJson, receiptTotalKeys);
  const receiptDiscount = getNumber(rawRowJson, receiptDiscountKeys);
  const arValue = getNullableNumber(rawRowJson, arBalanceKeys);
  const errors: string[] = [];
  if (!normalizedLedgerDate.ok) errors.push(ledgerDateErrorCode(normalizedLedgerDate.reason));

  if (rowType === "unknown") errors.push("분류할 수 없는 행입니다.");
  if ((rowType === "item_detail" || rowType === "customer_total" || rowType === "receipt") && !customerName) {
    errors.push("거래처명이 필요합니다.");
  }

  const identityPayload = {
    partCode: input.partCode,
    ledgerDate,
    rowType,
    customerCode,
    customerName,
    productName,
    rowIndex: rowType === "unknown" ? input.rowIndex : undefined,
  };

  const contentPayload = {
    identityPayload,
    quantity,
    unitPrice,
    salesAmount,
    receiptAmount,
    receiptDiscount,
    arValue,
    rawRowJson,
  };

  return {
    rowIndex: input.rowIndex,
    rowType,
    partCode: input.partCode,
    ledgerDate,
    ledgerDateFormatCategory: normalizedLedgerDate.formatCategory,
    ledgerDateWasNormalized: normalizedLedgerDate.ok ? normalizedLedgerDate.changedToIso : false,
    ledgerDateWasCarriedForward,
    ledgerDateIssue: normalizedLedgerDate.ok ? null : normalizedLedgerDate.reason,
    customerCode,
    customerName,
    productName,
    quantity,
    unitPrice,
    salesAmount,
    receiptAmount,
    receiptDiscount,
    arBalance: arValue,
    identityHash: stableHash(identityPayload),
    contentHash: stableHash(contentPayload),
    rawRowJson,
    errors,
  };
}

export function summarizePreview(input: {
  fileName: string;
  partCode: string;
  periodStart: string;
  periodEnd: string;
  rows: ReturnType<typeof parseLedgerRows>;
}) {
  const rows = input.rows;
  const issueSummary = summarizeRowIssues(rows);
  const successfulRows = rows.filter(isCommittablePreviewRow);
  const customerTotalRows = successfulRows.filter((row) => row.rowType === "customer_total");
  const itemDetailRows = successfulRows.filter((row) => row.rowType === "item_detail");
  const receiptRows = successfulRows.filter((row) => row.rowType === "receipt");
  const receiptSourceRows = receiptRows.length
    ? receiptRows
    : successfulRows.filter((row) => row.receiptAmount !== 0 || row.receiptDiscount !== 0);
  const salesSourceRows = customerTotalRows.length ? customerTotalRows : itemDetailRows;
  const arRows = successfulRows.filter((row) => row.arBalance !== null);

  return {
    fileName: input.fileName,
    partCode: input.partCode,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    totalRows: rows.length,
    parsableRows: rows.filter((row) => row.rowType !== "unknown").length,
    insertRows: rows.filter((row) => row.action === "insert").length,
    updateRows: rows.filter((row) => row.action === "update").length,
    skippedRows: rows.filter((row) => row.action === "skipped").length,
    excludedRows: issueSummary.excludedRows,
    warningRows: issueSummary.warningRows,
    errorRows: issueSummary.errorRows,
    excludedByReason: issueSummary.excludedByReason,
    warningByReason: issueSummary.warningByReason,
    errorByReason: issueSummary.errorByReason,
    salesTotal: salesSourceRows.reduce((sum, row) => sum + row.salesAmount, 0),
    receiptTotal: receiptSourceRows.reduce((sum, row) => sum + row.receiptAmount + row.receiptDiscount, 0),
    arBalance: arRows.at(-1)?.arBalance ?? 0,
    canCommit: issueSummary.errorRows === 0 && issueSummary.warningRows === 0,
    commitMode: "upsert_by_hash" as const,
  };
}

function getText(row: LedgerRawRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function shouldCarryForwardLedgerDate(rowType: LedgerRowType, reason: LedgerDateIssue | null) {
  if (reason !== "missing" && reason !== "invalid") return false;
  return rowType === "item_detail" || rowType === "customer_total" || rowType === "receipt";
}

function getValue(row: LedgerRawRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function ledgerDateErrorCode(reason: LedgerDateIssue) {
  if (reason === "missing") return "MISSING_LEDGER_DATE";
  if (reason === "invalid") return "INVALID_LEDGER_DATE";
  return "LEDGER_DATE_OUT_OF_SCOPE";
}

function getNumber(row: LedgerRawRow, keys: string[]) {
  return getNullableNumber(row, keys) ?? 0;
}

function getNullableNumber(row: LedgerRawRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(String(value).replace(/,/g, "").replace(/\s/g, "").replace(/원/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
