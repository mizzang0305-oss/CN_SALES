import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourcePath = join(process.cwd(), "src", "lib", "receivables", "receivable-dashboard-contract.ts");
const docPath = join(process.cwd(), "docs", "web-import", "WEB_IMPORT_RECEIVABLE_DASHBOARD_CONTRACT.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W12_RECEIVABLE_DASHBOARD_CONTRACT.md");

describe("receivable dashboard contract static safety", () => {
  it("documents the required receivable aggregate fields", () => {
    const source = readFileSync(sourcePath, "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(source).toContain("maskedCustomerKey");
    expect(source).toContain("outstandingAmount");
    expect(source).toContain("lastPaymentDate");
    expect(source).toContain("promiseDate");
    expect(source).toContain("riskLevel");
    expect(source).toContain("actionStatus");
    expect(doc).toContain("FINAL_STATUS: W12_RECEIVABLE_DASHBOARD_CONTRACT_READY");
  });

  it("keeps the receivable contract no-write and PII-safe", () => {
    const combined = [
      readFileSync(sourcePath, "utf8"),
      readFileSync(docPath, "utf8"),
      readFileSync(reportPath, "utf8"),
    ].join("\n");

    expect(combined).toContain("rawRowsReturned: false");
    expect(combined).not.toMatch(/\.from\(|insert\(|upsert\(|update\(|delete\(|rpc\(/);
    expect(combined).not.toContain("customerName");
    expect(combined).not.toContain("phoneNumber");
    expect(combined).not.toContain("businessNumber");
    expect(combined).not.toContain("rawRowJson");
    expect(combined).not.toContain("production POST executed");
    expect(combined).not.toContain("supabase db push");
  });
});
