import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const docPath = join(process.cwd(), "docs", "web-import", "WEB_ERP_XLS_SYNC_SCHEMA_APPLY_PREFLIGHT.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W18_SCHEMA_APPLY_PREFLIGHT_NO_WRITE.md");
const migrationDraftPath = join(process.cwd(), "supabase", "migrations", "0005_web_erp_xls_sync_current_view.sql");

describe("W-18 schema apply preflight no-write", () => {
  it("documents the explicit schema approval gate and no-write boundary", () => {
    expect(existsSync(docPath)).toBe(true);
    expect(existsSync(reportPath)).toBe(true);
    expect(existsSync(migrationDraftPath)).toBe(true);

    const doc = readFileSync(docPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("FINAL_STATUS: W18_SCHEMA_APPLY_PREFLIGHT_NO_WRITE_READY");
    expect(combined).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(combined).toContain("migration apply: FORBIDDEN");
    expect(combined).toContain("supabase db push: FORBIDDEN");
    expect(combined).toContain("DB write: FORBIDDEN");
    expect(combined).toContain("sync execute: FORBIDDEN");
    expect(combined).toContain("schema apply allowed now: NO");
  });

  it("requires rollback and policy/index/grant review before any future apply", () => {
    const doc = readFileSync(docPath, "utf8");

    expect(doc).toContain("Rollback plan");
    expect(doc).toContain("RLS/policy review");
    expect(doc).toContain("grant review");
    expect(doc).toContain("index review");
    expect(doc).toContain("owner approval");
    expect(doc).toContain("sync execution remains separate");
  });

  it("keeps raw rows, PII, secrets, and production mutation forbidden", () => {
    const doc = readFileSync(docPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("rawRowsReturned=false");
    expect(combined).toContain("raw row output: FORBIDDEN");
    expect(combined).toContain("PII output: FORBIDDEN");
    expect(combined).toContain("secret/env output: FORBIDDEN");
    expect(combined).toContain("production POST: FORBIDDEN");
    expect(combined).toContain("deploy/manual deploy: FORBIDDEN");
    expect(combined).not.toMatch(/WEB_ERP_XLS_SYNC_EXECUTE_APPROVED means schema apply/);
    expect(combined).not.toMatch(/schema apply allowed now:\s*YES/);
  });
});
