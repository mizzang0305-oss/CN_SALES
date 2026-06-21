import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourcePath = join(process.cwd(), "src", "lib", "reports", "monthly-import-report-contract.ts");
const docPath = join(process.cwd(), "docs", "web-import", "WEB_IMPORT_MONTHLY_REPORT_AGGREGATE_CONTRACT.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W11_MONTHLY_REPORT_AGGREGATE_CONTRACT.md");

describe("monthly import report aggregate contract static safety", () => {
  it("documents monthly aggregate report fields", () => {
    const source = readFileSync(sourcePath, "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(source).toContain("weeklyBreakdown");
    expect(source).toContain("carryOverItems");
    expect(source).toContain("excludedRows");
    expect(source).toContain("amountDelta");
    expect(doc).toContain("FINAL_STATUS: W11_MONTHLY_REPORT_AGGREGATE_CONTRACT_READY");
  });

  it("keeps the monthly contract no-write and aggregate-only", () => {
    const combined = [
      readFileSync(sourcePath, "utf8"),
      readFileSync(docPath, "utf8"),
      readFileSync(reportPath, "utf8"),
    ].join("\n");

    expect(combined).toContain("rawRowsReturned: false");
    expect(combined).not.toMatch(/\.from\(|insert\(|upsert\(|update\(|delete\(|rpc\(/);
    expect(combined).not.toContain("rawRowJson");
    expect(combined).not.toContain("customerName");
    expect(combined).not.toContain("productName");
    expect(combined).not.toContain("production POST executed");
    expect(combined).not.toContain("supabase db push");
  });
});
