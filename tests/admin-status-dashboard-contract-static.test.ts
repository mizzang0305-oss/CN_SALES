import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourcePath = join(process.cwd(), "src", "lib", "admin", "admin-status-dashboard-contract.ts");
const docPath = join(process.cwd(), "docs", "web-import", "WEB_IMPORT_ADMIN_STATUS_DASHBOARD_CONTRACT.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W13_ADMIN_STATUS_DASHBOARD_CONTRACT.md");

describe("admin status dashboard contract static safety", () => {
  it("documents the required all-part aggregate fields", () => {
    const source = readFileSync(sourcePath, "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(source).toContain("uploadStatus");
    expect(source).toContain("syncStatus");
    expect(source).toContain("sealedStatus");
    expect(source).toContain("candidateSummary");
    expect(source).toContain("receivableSummary");
    expect(source).toContain("reportReadiness");
    expect(source).toContain("adminAllPartAccess");
    expect(doc).toContain("FINAL_STATUS: W13_ADMIN_STATUS_DASHBOARD_CONTRACT_READY");
  });

  it("keeps the admin status contract no-write and aggregate-only", () => {
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
