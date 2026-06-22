import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(process.cwd(), "supabase", "migrations", "0006_web_erp_xls_sync_rls_policies.sql");
const planPath = join(process.cwd(), "docs", "web-import", "WEB_ERP_XLS_SYNC_RLS_POLICY_PLAN.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W21A_TARGET_AND_RLS_POLICY_PREFLIGHT.md");

const requiredTables = [
  "sales_import_batches",
  "sales_import_rows",
  "sales_current_records",
  "sales_import_change_summaries",
  "sales_change_audit_logs",
] as const;

describe("W-21A target and RLS policy preflight", () => {
  it("adds a draft policy migration for every current-view table", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");
    const createPolicyCount = [...migration.matchAll(/\bcreate\s+policy\b/gi)].length;

    expect(migration).toContain("W-21A DRAFT ONLY");
    expect(migration).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(migration).toContain("WEB_ERP_XLS_SYNC_EXECUTE_APPROVED");
    expect(createPolicyCount).toBeGreaterThanOrEqual(5);
    for (const table of requiredTables) {
      expect(migration).toContain(`on cn_sales.${table}`);
    }
  });

  it("documents the target selection blocker and no-apply boundary", () => {
    expect(existsSync(planPath)).toBe(true);
    expect(existsSync(reportPath)).toBe(true);

    const combined = `${readFileSync(planPath, "utf8")}\n${readFileSync(reportPath, "utf8")}`;

    expect(combined).toContain("FINAL_STATUS: W21A_TARGET_RLS_POLICY_PREFLIGHT_READY");
    expect(combined).toContain("selected target project ref: cwkjdbllgyojpggjjfhv");
    expect(combined).toContain("project name: mizzang0307");
    expect(combined).toContain("environment: production");
    expect(combined).toContain("region: ap-southeast-2");
    expect(combined).toContain("usage warning: EXCEEDING USAGE LIMITS shown in Supabase UI");
    expect(combined).toContain("target project selection status: SELECTED");
    expect(combined).toContain("No schema apply in this PR.");
    expect(combined).toContain("schema apply: NO");
    expect(combined).toContain("supabase db push: NO");
  });

  it("keeps data writes, raw rows, and sync execution forbidden", () => {
    const migration = readFileSync(migrationPath, "utf8");
    const combined = [
      migration,
      readFileSync(planPath, "utf8"),
      readFileSync(reportPath, "utf8"),
    ].join("\n");

    expect(combined).toContain("No physical delete.");
    expect(combined).toContain("No raw row API output.");
    expect(combined).toContain("No sync execute without WEB_ERP_XLS_SYNC_EXECUTE_APPROVED.");
    expect(combined).toContain("rawRowsReturned=false");
    expect(combined).not.toMatch(/\bdelete\s+from\s+(cn_sales|public)\./i);
    expect(combined).not.toMatch(/\binsert\s+into\b/i);
    expect(combined).not.toMatch(/\bupdate\s+cn_sales\./i);
    expect(combined).not.toMatch(/sync execute allowed now:\s*YES/i);
  });
});
