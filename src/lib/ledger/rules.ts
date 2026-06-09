import { stableHash } from "@/lib/ledger/hash";
import type { ImportAction, LedgerRawRow, LedgerRowType, ParsedLedgerRow } from "@/lib/types";

const emptyRow: LedgerRawRow = {};

export function classifyLedgerRow(rawRowJson: LedgerRawRow = emptyRow): LedgerRowType {
  const label = String(
    rawRowJson["구분"] ??
      rawRowJson["row_type"] ??
      rawRowJson["품명"] ??
      rawRowJson["상품명"] ??
      "",
  );

  if (/총계|합계계|grand/i.test(label)) return "grand_total";
  if (/일계|daily/i.test(label)) return "daily_total";
  if (/거래처.?계|거래처.?합계|customer.?total/i.test(label)) return "customer_total";
  if (/입금|회입|receipt/i.test(label)) return "receipt";

  const productName = getText(rawRowJson, ["상품명", "품명", "product_name"]);
  const quantity = getNumber(rawRowJson, ["수량", "quantity"]);
  const unitPrice = getNumber(rawRowJson, ["단가", "unit_price"]);
  const salesAmount = getNumber(rawRowJson, ["매출액", "금액", "sales_amount", "amount"]);

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
  return input.rows.map((rawRowJson, index) => {
    const row = normalizeLedgerRow({
      rawRowJson,
      rowIndex: index + 1,
      partCode: input.partCode,
      fallbackDate: input.periodEnd,
    });
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
  fallbackDate: string;
}): ParsedLedgerRow {
  const rawRowJson = input.rawRowJson;
  const rowType = classifyLedgerRow(rawRowJson);
  const ledgerDate = getText(rawRowJson, ["일자", "날짜", "date"]) || input.fallbackDate;
  const customerCode = getText(rawRowJson, ["거래처코드", "customer_code", "코드"]) || null;
  const customerName = getText(rawRowJson, ["거래처명", "customer_name", "거래처"]) || null;
  const productName = getText(rawRowJson, ["상품명", "품명", "product_name"]) || null;
  const quantity = getNumber(rawRowJson, ["수량", "quantity"]);
  const unitPrice = getNumber(rawRowJson, ["단가", "unit_price"]);
  const salesAmount = getNumber(rawRowJson, ["매출액", "금액", "sales_amount", "amount"]);
  const receiptAmount = getNumber(rawRowJson, ["입금액", "회입액", "receipt_amount"]);
  const receiptDiscount = getNumber(rawRowJson, ["입금할인", "회입할인", "receipt_discount"]);
  const arValue = getNullableNumber(rawRowJson, ["외상잔액", "잔액", "ar_balance"]);
  const errors: string[] = [];

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
  const customerTotalRows = rows.filter((row) => row.rowType === "customer_total" && row.action !== "error");
  const receiptRows = rows.filter((row) => row.rowType === "receipt" && row.action !== "error");
  const arRows = rows.filter((row) => row.arBalance !== null && row.action !== "error");

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
    errorRows: rows.filter((row) => row.action === "error").length,
    salesTotal: customerTotalRows.reduce((sum, row) => sum + row.salesAmount, 0),
    receiptTotal: receiptRows.reduce((sum, row) => sum + row.receiptAmount + row.receiptDiscount, 0),
    arBalance: arRows.at(-1)?.arBalance ?? 0,
    canCommit: rows.every((row) => row.action !== "error"),
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

function getNumber(row: LedgerRawRow, keys: string[]) {
  return getNullableNumber(row, keys) ?? 0;
}

function getNullableNumber(row: LedgerRawRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(String(value).replace(/[,\s원]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
