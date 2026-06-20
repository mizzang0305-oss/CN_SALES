import { stableHash } from "@/lib/ledger/hash";
import { normalizeMasterName } from "@/lib/import/master-data";
import type { LedgerRowType, ParsedLedgerRow } from "@/lib/types";

export interface LedgerSyncSourceRow {
  rowIndex: number;
  rowType: LedgerRowType;
  partCode: string;
  ledgerDate: string;
  customerCode: string | null;
  customerName: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  salesAmount: number;
  receiptAmount: number;
  receiptDiscount: number;
  arBalance: number | null;
}

export interface LedgerSyncRow {
  naturalKey: string;
  occurrenceIndexWithinNaturalKey: number;
  identityHash: string;
  contentHash: string;
  syncKey: string;
  syncContentHash: string;
  keyVersion: "natural_occurrence_v2" | "schema_identity_v1";
  partCode: string;
  ledgerDate: string;
  rowType: LedgerRowType;
  rowIndex: number;
  syncOrdinal?: number;
  amountTotal?: number;
}

export function createLedgerIdentitySyncRows(
  rows: Array<(LedgerSyncSourceRow | ParsedLedgerRow) & { identityHash: string; contentHash: string }>,
): LedgerSyncRow[] {
  return rows.map((row) => ({
    naturalKey: `schema_identity_v1:${row.identityHash}`,
    occurrenceIndexWithinNaturalKey: 1,
    identityHash: row.identityHash,
    contentHash: row.contentHash,
    syncKey: row.identityHash,
    syncContentHash: row.contentHash,
    keyVersion: "schema_identity_v1",
    partCode: row.partCode,
    ledgerDate: row.ledgerDate,
    rowType: row.rowType,
    rowIndex: row.rowIndex,
  }));
}

export function createLedgerSyncRows(rows: Array<LedgerSyncSourceRow | ParsedLedgerRow>): LedgerSyncRow[] {
  const grouped = new Map<string, Array<{ row: LedgerSyncSourceRow | ParsedLedgerRow; index: number }>>();

  rows.forEach((row, index) => {
    const naturalKey = createSyncNaturalKey(row);
    const bucket = grouped.get(naturalKey) ?? [];
    bucket.push({ row, index });
    grouped.set(naturalKey, bucket);
  });

  const output: LedgerSyncRow[] = [];
  for (const [naturalKey, bucket] of grouped.entries()) {
    const sorted = [...bucket].sort((left, right) => left.row.rowIndex - right.row.rowIndex || left.index - right.index);
    sorted.forEach(({ row, index }, ordinalIndex) => {
      const occurrenceIndexWithinNaturalKey = ordinalIndex + 1;
      const identityHash = stableHash({ naturalKey, occurrenceIndexWithinNaturalKey });
      const contentHash = createSyncContentHash(row);
      output[index] = {
        naturalKey,
        occurrenceIndexWithinNaturalKey,
        identityHash,
        contentHash,
        syncKey: identityHash,
        syncContentHash: contentHash,
        keyVersion: "natural_occurrence_v2",
        partCode: row.partCode,
        ledgerDate: row.ledgerDate,
        rowType: row.rowType,
        rowIndex: row.rowIndex,
        syncOrdinal: occurrenceIndexWithinNaturalKey,
        amountTotal: row.salesAmount + row.receiptAmount + row.receiptDiscount,
      };
    });
  }

  return output;
}

export function createSyncContentHash(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  return stableHash({
    rowType: row.rowType,
    customerKey: customerKey(row),
    productKey: productKey(row),
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    salesAmount: row.salesAmount,
    receiptAmount: row.receiptAmount,
    receiptDiscount: row.receiptDiscount,
    arBalance: row.arBalance,
  });
}

function createSyncNaturalKey(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  return stableHash({
    partCode: row.partCode,
    ledgerDate: row.ledgerDate,
    customerKey: customerKey(row),
    documentNo: documentNoOrBlank(row),
    productKey: productKey(row),
    rowType: row.rowType,
  });
}

function customerKey(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  return normalizeMasterName(row.customerCode || row.customerName || "");
}

function productKey(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  return normalizeMasterName(row.productName || "");
}

function documentNoOrBlank(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  void row;
  return "";
}
