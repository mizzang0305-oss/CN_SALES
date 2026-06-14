import { describe, expect, it } from "vitest";
import { createLedgerIdentitySyncRows, createLedgerSyncRows } from "@/lib/import/sync-key";
import type { ParsedLedgerRow } from "@/lib/types";

describe("ledger sync key policy", () => {
  it("creates the same natural key for the same transaction fields", () => {
    const [left] = createLedgerSyncRows([ledgerRow({ rowIndex: 9 })]);
    const [right] = createLedgerSyncRows([ledgerRow({ rowIndex: 42 })]);

    expect(left.naturalKey).toBe(right.naturalKey);
    expect(left.syncKey).toBe(right.syncKey);
    expect(left.identityHash).toBe(left.syncKey);
    expect(left.occurrenceIndexWithinNaturalKey).toBe(1);
  });

  it("changes the content hash when quantity or amount changes without changing the natural key", () => {
    const [before] = createLedgerSyncRows([ledgerRow({ quantity: 1, salesAmount: 1000 })]);
    const [after] = createLedgerSyncRows([ledgerRow({ quantity: 2, salesAmount: 2000 })]);

    expect(after.naturalKey).toBe(before.naturalKey);
    expect(after.syncKey).toBe(before.syncKey);
    expect(after.syncContentHash).not.toBe(before.syncContentHash);
    expect(after.contentHash).toBe(after.syncContentHash);
  });

  it("uses occurrence indexes to keep repeated same-day customer/product rows distinguishable", () => {
    const rows = createLedgerSyncRows([
      ledgerRow({ rowIndex: 7, salesAmount: 1000 }),
      ledgerRow({ rowIndex: 8, salesAmount: 2000 }),
    ]);

    expect(rows[0].naturalKey).toBe(rows[1].naturalKey);
    expect(rows[0].occurrenceIndexWithinNaturalKey).toBe(1);
    expect(rows[1].occurrenceIndexWithinNaturalKey).toBe(2);
    expect(rows[0].syncOrdinal).toBe(1);
    expect(rows[1].syncOrdinal).toBe(2);
    expect(rows[0].syncKey).not.toBe(rows[1].syncKey);
    expect(rows[0].identityHash).not.toBe(rows[1].identityHash);
  });

  it("keeps amount, quantity, and unit price out of the natural key", () => {
    const [before] = createLedgerSyncRows([
      ledgerRow({ quantity: 1, unitPrice: 1000, salesAmount: 1000, receiptAmount: 0 }),
    ]);
    const [after] = createLedgerSyncRows([
      ledgerRow({ quantity: 99, unitPrice: 3333, salesAmount: 999999, receiptAmount: 1000 }),
    ]);

    expect(after.naturalKey).toBe(before.naturalKey);
    expect(after.identityHash).toBe(before.identityHash);
    expect(after.contentHash).not.toBe(before.contentHash);
  });

  it("can use the current ledger schema identity/content hashes as the sync key contract", () => {
    const [row] = createLedgerIdentitySyncRows([ledgerRow({ identityHash: "identity-a", contentHash: "content-a" })]);

    expect(row.syncKey).toBe("identity-a");
    expect(row.syncContentHash).toBe("content-a");
    expect(row.identityHash).toBe("identity-a");
    expect(row.contentHash).toBe("content-a");
    expect(row.keyVersion).toBe("schema_identity_v1");
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
