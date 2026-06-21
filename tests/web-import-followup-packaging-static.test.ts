import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const packagingDocPath = join(process.cwd(), "docs", "web-import", "WEB_IMPORT_FOLLOWUP_PR_PACKAGING_PLAN.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W15_LOCAL_FOLLOWUP_PACKAGING_AND_NAV_READINESS.md");

describe("W-15 local follow-up packaging plan", () => {
  it("documents the local W-5B through W-14 follow-up package", () => {
    expect(existsSync(packagingDocPath)).toBe(true);
    expect(existsSync(reportPath)).toBe(true);

    const doc = readFileSync(packagingDocPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("FINAL_STATUS: LOCAL_ONLY_W15_FOLLOWUP_PACKAGING_READY");
    expect(combined).toContain("W-5B");
    expect(combined).toContain("W-6");
    expect(combined).toContain("W-7/W-8");
    expect(combined).toContain("W-9");
    expect(combined).toContain("W-10");
    expect(combined).toContain("W-11");
    expect(combined).toContain("W-12");
    expect(combined).toContain("W-13");
    expect(combined).toContain("W-14");
    expect(combined).toContain("88dd9d3");
    expect(combined).toContain("74753d9");
  });

  it("contains a future PR body draft without allowing local push, merge, or deploy", () => {
    const doc = readFileSync(packagingDocPath, "utf8");

    expect(doc).toContain("feat(web-import): add schema draft and reporting readiness");
    expect(doc).toContain("W-5B/W-6/W-7/W-8/W-9/W-10/W-11/W-12/W-13/W-14 follow-up only");
    expect(doc).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(doc).toContain("WEB_ERP_XLS_SYNC_EXECUTE_APPROVED");
    expect(doc).toContain("push allowed now: NO");
    expect(doc).toContain("PR allowed now: NO");
    expect(doc).toContain("merge allowed now: NO");
    expect(doc).toContain("deploy: NO");
  });

  it("keeps the package no-write, no-apply, and no-secret", () => {
    const doc = readFileSync(packagingDocPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("DB write: NO");
    expect(combined).toContain("migration apply: NO");
    expect(combined).toContain("sync/apply: NO");
    expect(combined).toContain("production POST: NO");
    expect(combined).toContain("raw row/PII/secret: NO");
    expect(combined).toContain("enabled sync button: NO");
    expect(combined).toContain("docs/adsense staged: NO");
    expect(combined).toContain(".codex/config.toml staged: NO");
    expect(combined).not.toMatch(/sk-[A-Za-z0-9]|SERVICE_ROLE|PASSWORD\s*=/);
  });
});
