import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourcePath = join(process.cwd(), "src", "lib", "reports", "weekly-import-report-contract.ts");
const docPath = join(process.cwd(), "docs", "web-import", "WEB_IMPORT_WEEKLY_REPORT_DATA_CONTRACT.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W10_WEEKLY_REPORT_DATA_CONTRACT.md");

describe("weekly import report contract static safety", () => {
  it("documents the required aggregate report fields", () => {
    const source = readFileSync(sourcePath, "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(source).toContain("insertCandidates");
    expect(source).toContain("updateCandidates");
    expect(source).toContain("removedFromCurrentCandidates");
    expect(source).toContain("noChangeRows");
    expect(source).toContain("amountDelta");
    expect(source).toContain("receivableLinkStatus");
    expect(source).toContain("carryOverStatus");
    expect(source).toContain("monthlyMemoStatus");
    expect(doc).toContain("FINAL_STATUS: W10_WEEKLY_REPORT_DATA_CONTRACT_READY");
  });

  it("keeps weekly report contract no-write and aggregate-only", () => {
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
