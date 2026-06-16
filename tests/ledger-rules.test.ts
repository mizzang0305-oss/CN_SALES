import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { parseLedgerRows, summarizePreview } from "@/lib/ledger/rules";

const rows = [
  { 거래일자: "2026-06-07", 거래처명: "Synthetic Mart", "구분(내용)": "거래처계", 합계액: 1000, 잔액: 3000 },
  { 거래일자: "2026-06-07", 거래처명: "Synthetic Mart", "상  품  명": "Synthetic Product", 수량: 1, 단가: 1000, 합계액: 1000 },
  { 거래일자: "2026-06-07", 거래처명: "Synthetic Mart", "구분(내용)": "입금", 입금액: 700, 할인: 50 },
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

  it("uses item detail sales when a ledger has no customer total rows", () => {
    const itemOnlyRows = rows.filter((row) => row["구분(내용)"] !== "거래처계");
    const parsed = parseLedgerRows({ rows: itemOnlyRows, partCode: "A", periodStart: "2026-06-01", periodEnd: "2026-06-30" });
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
    const changed = [{ ...rows[0], 합계액: 1200 }, rows[1], rows[2]];
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

  it("normalizes parseable source dates before identity and sync planning", () => {
    const parsed = parseLedgerRows({
      rows: [{
        date: "2026.6.1",
        row_type: "customer_total",
        customer_name: "Synthetic Mart",
        sales_amount: 1000,
      }],
      partCode: "11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
    });

    assert.equal(parsed[0].ledgerDate, "2026-06-01");
    assert.equal(parsed[0].ledgerDateFormatCategory, "yyyy.m.d");
    assert.equal(parsed[0].ledgerDateWasNormalized, true);
    assert.equal(parsed[0].action, "insert");
    assert.deepEqual(parsed[0].errors, []);
  });

  it("blocks missing or out-of-scope transaction dates without falling back to periodEnd", () => {
    const parsed = parseLedgerRows({
      rows: [
        {
          row_type: "customer_total",
          customer_name: "Synthetic Mart",
          sales_amount: 1000,
        },
        {
          date: "2026-06-07",
          row_type: "customer_total",
          customer_name: "Synthetic Mart",
          sales_amount: 2000,
        },
      ],
      partCode: "11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
    });
    const summary = summarizePreview({
      fileName: "sample.json",
      partCode: "11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      rows: parsed,
    });

    assert.equal(parsed[0].ledgerDate, "");
    assert.equal(parsed[0].action, "error");
    assert.equal(parsed[1].ledgerDate, "");
    assert.equal(parsed[1].action, "error");
    assert.equal(summary.errorRows, 2);
    assert.deepEqual(summary.errorByReason, {
      LEDGER_DATE_OUT_OF_SCOPE: 1,
      MISSING_LEDGER_DATE: 1,
    });
  });

  it("carries forward the last canonical in-scope date for grouped transaction rows", () => {
    const parsed = parseLedgerRows({
      rows: [
        {
          date: "\u3010 01\uC77C \u3011",
          row_type: "date_header",
        },
        {
          date: "[group label]",
          row_type: "item_detail",
          customer_name: "Synthetic Mart",
          product_name: "Synthetic Product",
          quantity: 1,
          unit_price: 1000,
          sales_amount: 1000,
        },
        {
          row_type: "receipt",
          customer_name: "Synthetic Mart",
          receipt_amount: 500,
        },
      ],
      partCode: "11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
    });

    assert.equal(parsed[0].rowType, "unknown");
    assert.equal(parsed[0].ledgerDate, "2026-06-01");
    assert.equal(parsed[1].ledgerDate, "2026-06-01");
    assert.equal(parsed[1].ledgerDateWasCarriedForward, true);
    assert.equal(parsed[1].action, "insert");
    assert.deepEqual(parsed[1].errors, []);
    assert.equal(parsed[2].ledgerDate, "2026-06-01");
    assert.equal(parsed[2].ledgerDateWasCarriedForward, true);
    assert.equal(parsed[2].action, "insert");
    assert.deepEqual(parsed[2].errors, []);
  });
});
