import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const docPath = join(process.cwd(), "docs", "web-import", "WEB_IMPORT_OPERATOR_HANDOVER.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W20_OPERATOR_HANDOVER_AND_APPROVAL_GATE_SUMMARY.md");

describe("W-20 operator handover and approval gate summary", () => {
  it("documents the current read-only web import capabilities", () => {
    expect(existsSync(docPath)).toBe(true);
    expect(existsSync(reportPath)).toBe(true);

    const doc = readFileSync(docPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("FINAL_STATUS: W20_OPERATOR_HANDOVER_AND_APPROVAL_GATE_SUMMARY_READY");
    expect(combined).toContain("Excel preview");
    expect(combined).toContain("dry-run");
    expect(combined).toContain("readiness routes");
    expect(combined).toContain("weekly/monthly/receivable/admin aggregate shell");
    expect(combined).toContain("admin import audit readiness");
    expect(combined).toContain("disabled sync-scope contract");
  });

  it("keeps unavailable operations explicitly blocked", () => {
    const doc = readFileSync(docPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("DB migration apply: unavailable");
    expect(combined).toContain("real current-view persistence: unavailable");
    expect(combined).toContain("sync execute: unavailable");
    expect(combined).toContain("physical delete: unavailable");
    expect(combined).toContain("raw row output: unavailable");
    expect(combined).toContain("schema apply allowed now: NO");
    expect(combined).toContain("sync execute allowed now: NO");
  });

  it("separates the required schema and sync approval gates", () => {
    const doc = readFileSync(docPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(combined).toContain("WEB_ERP_XLS_SYNC_EXECUTE_APPROVED");
    expect(combined).toContain("schema approval does not authorize sync execution");
    expect(combined).toContain("sync approval does not authorize schema apply");
    expect(combined).toContain("rawRowsReturned=false");
    expect(combined).toContain("enabled sync/apply button: FORBIDDEN");
    expect(combined).not.toMatch(/schema apply allowed now:\s*YES/);
    expect(combined).not.toMatch(/sync execute allowed now:\s*YES/);
  });
});
