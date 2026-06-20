import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readerSource = readFileSync(join(process.cwd(), "src", "lib", "import", "sync-existing-reader.ts"), "utf8");
const confirmRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "uploads", "confirm", "route.ts"), "utf8");

describe("sync existing row reader safety", () => {
  it("uses explicit read-only ledger row columns without source payload columns or write calls", () => {
    expect(readerSource).toContain('const existingLedgerRowsColumns = "id, row_index, ledger_date, row_type, identity_hash, content_hash, sales_amount, receipt_amount, receipt_discount"');
    expect(readerSource).toContain("select(existingLedgerRowsColumns, { count: \"exact\" })");
    expect(readerSource).not.toContain("raw_row_json");
    expect(readerSource).not.toContain("customer_name");
    expect(readerSource).not.toContain("product_name");
    expect(readerSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });

  it("pages existing ledger reads with deterministic ordering and incomplete-read blocking", () => {
    expect(readerSource).toContain("existingLedgerRowsPageSize = 500");
    expect(readerSource).toContain(".order(\"ledger_date\", { ascending: true })");
    expect(readerSource).toContain(".order(\"row_index\", { ascending: true })");
    expect(readerSource).toContain(".range(from, to)");
    expect(readerSource).toContain("SYNC_DIFF_DB_READ_INCOMPLETE");
    expect(readerSource).toContain("rawRowsReturned: false");
  });

  it("returns only aggregate reader diagnostics through confirm dry-run evidence", () => {
    expect(confirmRouteSource).toContain("reader: existingRead.diagnostics");
    expect(confirmRouteSource).not.toContain("rawRowsReturned: true");
  });
});
