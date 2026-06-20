import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(process.cwd(), "supabase", "migrations", "0005_web_erp_xls_sync_current_view.sql");
const applyPlanPath = join(process.cwd(), "docs", "web-import", "WEB_ERP_XLS_SYNC_SCHEMA_APPLY_PLAN.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W5B_SCHEMA_MIGRATION_DRAFT_ONLY.md");

describe("W-5B schema migration draft", () => {
  it("adds the current-view schema as a draft-only migration", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("W-5B DRAFT ONLY");
    expect(migration).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(migration).toContain("create table if not exists cn_sales.sales_import_batches");
    expect(migration).toContain("create table if not exists cn_sales.sales_import_rows");
    expect(migration).toContain("create table if not exists cn_sales.sales_current_records");
    expect(migration).toContain("create table if not exists cn_sales.sales_import_change_summaries");
    expect(migration).toContain("create table if not exists cn_sales.sales_change_audit_logs");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("grant select");
    expect(migration).toContain("physical delete is forbidden");
  });

  it("keeps the schema apply plan approval-gated and no-apply", () => {
    const applyPlan = readFileSync(applyPlanPath, "utf8");
    const report = readFileSync(reportPath, "utf8");

    expect(applyPlan).toContain("FINAL_STATUS: W5B_SCHEMA_MIGRATION_DRAFT_ONLY_READY");
    expect(applyPlan).toContain("migration applied: no");
    expect(applyPlan).toContain("DB write: no");
    expect(applyPlan).toContain("W-6_SYNC_SCOPE_API_DRAFT_DISABLED");
    expect(report).toContain("FINAL_STATUS: W5B_SCHEMA_MIGRATION_DRAFT_ONLY_READY");
    expect(report).toContain("no push, no PR, no merge");
  });

  it("does not include seed, storage, or production execution commands", () => {
    const migration = readFileSync(migrationPath, "utf8");
    const docs = [readFileSync(applyPlanPath, "utf8"), readFileSync(reportPath, "utf8")].join("\n");

    expect(migration).not.toContain("supabase db push");
    expect(migration).not.toMatch(/\binsert\s+into\b|\bupdate\s+cn_sales\.|\bdelete\s+from\b|\bcopy\s+cn_sales\./i);
    expect(migration).not.toContain("storage.objects");
    expect(docs).toContain("`supabase db push`: not run");
    expect(docs).toContain("Seed/storage: not performed");
    expect(docs).not.toContain("production POST executed");
  });
});
