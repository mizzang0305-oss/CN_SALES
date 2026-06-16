import { describe, expect, it } from "vitest";
import { parseLedgerRows, summarizePreview } from "@/lib/ledger/rules";
import { classifyRowIssue, summarizeRowIssues } from "@/lib/import/row-classification";
import type { LedgerRawRow } from "@/lib/types";

describe("upload row issue classification", () => {
  it("classifies blank, header, subtotal, and non-transaction rows as excluded rows", () => {
    const rows: LedgerRawRow[] = [
      {},
      { row_type: "date customer product amount" },
      { row_type: "subtotal" },
      { note: "reference memo" },
    ];
    const parsed = parseLedgerRows({ rows, partCode: "11", periodStart: "2026-06-01", periodEnd: "2026-06-06" });
    const summary = summarizePreview({
      fileName: "part-11-ledger.json",
      partCode: "11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      rows: parsed,
    });

    expect(summary.excludedRows).toBe(4);
    expect(summary.warningRows).toBe(0);
    expect(summary.errorRows).toBe(0);
    expect(summary.excludedByReason).toEqual({
      BLANK_ROW: 1,
      NON_TRANSACTION_ROW: 1,
      REPEATED_HEADER: 1,
      SUBTOTAL_ROW: 1,
    });
    expect(summary.warningByReason).toEqual({});
    expect(summary.errorByReason).toEqual({});
    expect(summary.canCommit).toBe(true);
  });

  it("classifies missing required customer names as error rows", () => {
    const rows: LedgerRawRow[] = [
      { date: "2026-06-01", row_type: "item_detail", product_name: "Synthetic Product", quantity: 1, unit_price: 1000, sales_amount: 1000 },
    ];
    const parsed = parseLedgerRows({ rows, partCode: "11", periodStart: "2026-06-01", periodEnd: "2026-06-06" });
    const summary = summarizePreview({
      fileName: "part-11-ledger.json",
      partCode: "11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      rows: parsed,
    });

    expect(summary.excludedRows).toBe(0);
    expect(summary.errorRows).toBe(1);
    expect(summary.errorByReason).toEqual({ MISSING_CUSTOMER: 1 });
    expect(summary.canCommit).toBe(false);
  });

  it("returns aggregate reason codes only", () => {
    const rows: LedgerRawRow[] = [{ note: "sensitive text must not become a reason" }];
    const parsed = parseLedgerRows({ rows, partCode: "11", periodStart: "2026-06-01", periodEnd: "2026-06-06" });
    const issue = classifyRowIssue(parsed[0]);
    const summary = summarizeRowIssues(parsed);

    expect(issue).toEqual({ severity: "excluded", reason: "NON_TRANSACTION_ROW" });
    expect(JSON.stringify(summary)).not.toContain("sensitive text");
  });
});
