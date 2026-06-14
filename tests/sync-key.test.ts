import { describe, expect, it } from "vitest";
import { createLedgerIdentitySyncRows, createLedgerSyncRows } from "@/lib/import/sync-key";
import type { ParsedLedgerRow } from "@/lib/types";

describe("ledger sync key policy", () => {
  it("creates the same sync key for the same transaction fields", () => {
    const [left] = createLedgerSyncRows([ledgerRow({ rowIndex: 9 })]);
    const [right] = createLedgerSyncRows([ledgerRow({ rowIndex: 42 })]);

    expect(left.syncKey).toBe(right.syncKey);
  });

  it("changes the content hash when quantity or amount changes without changing the sync key", () => {
    const [before] = createLedgerSyncRows([ledgerRow({ quantity: 1, salesAmount: 1000 })]);
    const [after] = createLedgerSyncRows([ledgerRow({ quantity: 2, salesAmount: 2000 })]);

    expect(after.syncKey).toBe(before.syncKey);
    expect(after.syncContentHash).not.toBe(before.syncContentHash);
  });

  it("uses an ordinal to keep repeated same-day customer/product rows distinguishable", () => {
    const rows = createLedgerSyncRows([
      ledgerRow({ rowIndex: 7, salesAmount: 1000 }),
      ledgerRow({ rowIndex: 8, salesAmount: 2000 }),
    ]);

    expect(rows[0].syncOrdinal).toBe(1);
    expect(rows[1].syncOrdinal).toBe(2);
    expect(rows[0].syncKey).not.toBe(rows[1].syncKey);
  });

  it("can use the current ledger schema identity/content hashes as the sync key contract", () => {
    const [row] = createLedgerIdentitySyncRows([ledgerRow({ identityHash: "identity-a", contentHash: "content-a" })]);

    expect(row.syncKey).toBe("identity-a");
    expect(row.syncContentHash).toBe("content-a");
  });
});

function ledgerRow(overrides: Partial<ParsedLedgerRow> = {}): ParsedLedgerRow {
  return {
    rowIndex: 1,
    rowType: "item_detail",
    partCode: "11",
    ledgerDate: "2026-06-03",
    customerCode: null,
    customerName: "Synthetic Customer",
    productName: "Synthetic Product",
    quantity: 1,
    unitPrice: 1000,
    salesAmount: 1000,
    receiptAmount: 0,
    receiptDiscount: 0,
    arBalance: null,
    identityHash: "identity",
    contentHash: "content",
    rawRowJson: {},
    errors: [],
    ...overrides,
  };
}
