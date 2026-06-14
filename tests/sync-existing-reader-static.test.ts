import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readerSource = readFileSync(join(process.cwd(), "src", "lib", "import", "sync-existing-reader.ts"), "utf8");

describe("sync existing row reader safety", () => {
  it("uses explicit read-only ledger row columns without source payload columns or write calls", () => {
    expect(readerSource).toContain('select("id, row_index, ledger_date, row_type, identity_hash, content_hash")');
    expect(readerSource).not.toContain("raw_row_json");
    expect(readerSource).not.toContain("customer_name");
    expect(readerSource).not.toContain("product_name");
    expect(readerSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });
});
