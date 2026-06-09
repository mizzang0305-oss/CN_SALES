import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { parseLedgerRows, summarizePreview } from "@/lib/ledger/rules";

const rows = [
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "거래처계", 매출액: 1000, 외상잔액: 3000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 상품명: "왕만두", 수량: 1, 단가: 1000, 매출액: 1000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "입금", 입금액: 700, 입금할인: 50 },
];

describe("ledger import rules", () => {
  it("does not double count item_detail and customer_total for reporting sales", () => {
    const parsed = parseLedgerRows({ rows, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30" });
    const summary = summarizePreview({
      fileName: "sample.xlsx",
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      rows: parsed,
    });

    assert.equal(summary.salesTotal, 1000);
  });

  it("calculates receipts from amount plus discount", () => {
    const parsed = parseLedgerRows({ rows, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30" });
    const summary = summarizePreview({
      fileName: "sample.xlsx",
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      rows: parsed,
    });

    assert.equal(summary.receiptTotal, 750);
  });

  it("marks same identity and same content as skipped on second import", () => {
    const first = parseLedgerRows({ rows, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30" });
    const existingHashes = Object.fromEntries(first.map((row) => [row.identityHash, row.contentHash]));
    const second = parseLedgerRows({ rows, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30", existingHashes });

    assert.equal(second.every((row) => row.action === "skipped"), true);
  });

  it("marks same identity and changed content as update", () => {
    const first = parseLedgerRows({ rows, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30" });
    const existingHashes = Object.fromEntries(first.map((row) => [row.identityHash, row.contentHash]));
    const changed = [{ ...rows[0], 매출액: 1200 }, rows[1], rows[2]];
    const second = parseLedgerRows({ rows: changed, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30", existingHashes });

    assert.equal(second[0].action, "update");
  });

  it("keeps ar snapshot value from ledger rows with balances", () => {
    const parsed = parseLedgerRows({ rows, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30" });
    const summary = summarizePreview({
      fileName: "sample.xlsx",
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      rows: parsed,
    });

    assert.equal(summary.arBalance, 3000);
  });
});
