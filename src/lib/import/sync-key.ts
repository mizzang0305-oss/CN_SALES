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
  syncKey: string;
  syncContentHash: string;
  partCode: string;
  ledgerDate: string;
  rowType: LedgerRowType;
  rowIndex: number;
  syncOrdinal?: number;
}

export function createLedgerIdentitySyncRows(
  rows: Array<(LedgerSyncSourceRow | ParsedLedgerRow) & { identityHash: string; contentHash: string }>,
): LedgerSyncRow[] {
  return rows.map((row) => ({
    syncKey: row.identityHash,
    syncContentHash: row.contentHash,
    partCode: row.partCode,
    ledgerDate: row.ledgerDate,
    rowType: row.rowType,
    rowIndex: row.rowIndex,
  }));
}

export function createLedgerSyncRows(rows: Array<LedgerSyncSourceRow | ParsedLedgerRow>): LedgerSyncRow[] {
  const grouped = new Map<string, Array<{ row: LedgerSyncSourceRow | ParsedLedgerRow; index: number }>>();

  rows.forEach((row, index) => {
    const baseKey = createSyncBaseKey(row);
    const bucket = grouped.get(baseKey) ?? [];
    bucket.push({ row, index });
    grouped.set(baseKey, bucket);
  });

  const output: LedgerSyncRow[] = [];
  for (const [baseKey, bucket] of grouped.entries()) {
    const sorted = [...bucket].sort((left, right) => left.row.rowIndex - right.row.rowIndex || left.index - right.index);
    sorted.forEach(({ row, index }, ordinalIndex) => {
      const syncOrdinal = sorted.length > 1 ? ordinalIndex + 1 : undefined;
      output[index] = {
        syncKey: stableHash({ baseKey, syncOrdinal: syncOrdinal ?? 1 }),
        syncContentHash: createSyncContentHash(row),
        partCode: row.partCode,
        ledgerDate: row.ledgerDate,
        rowType: row.rowType,
        rowIndex: row.rowIndex,
        syncOrdinal,
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

function createSyncBaseKey(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  return stableHash({
    partCode: row.partCode,
    ledgerDate: row.ledgerDate,
    rowType: row.rowType,
    customerKey: customerKey(row),
    productKey: productKey(row),
  });
}

function customerKey(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  return normalizeMasterName(row.customerCode || row.customerName || "");
}

function productKey(row: LedgerSyncSourceRow | ParsedLedgerRow) {
  return normalizeMasterName(row.productName || "");
}
