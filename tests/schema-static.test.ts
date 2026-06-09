import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(join(process.cwd(), "supabase", "migrations", "0001_initial_mvp.sql"), "utf8");
const repositoryTs = readFileSync(join(process.cwd(), "src", "lib", "import", "supabase-repository.ts"), "utf8");
const phase3bEnvSetup = readFileSync(join(process.cwd(), "docs", "phase3b_env_setup.md"), "utf8");
const storageSetupSql = readFileSync(join(process.cwd(), "supabase", "storage_setup_cn_sales.sql"), "utf8");

const requiredTables = [
  "companies",
  "profiles",
  "sales_parts",
  "sales_reps",
  "customers",
  "products",
  "product_groups",
  "ledger_uploads",
  "ledger_rows",
  "ledger_row_versions",
  "upload_preview_results",
  "sales_transactions",
  "receipt_transactions",
  "ar_snapshots",
  "monthly_targets",
  "claims",
  "claim_attachments",
  "visit_logs",
  "visit_log_attachments",
  "visit_log_products",
  "task_promises",
  "report_exports",
  "customer_links",
  "product_links",
];

describe("cn_sales schema migration static checks", () => {
  it("creates cn_sales schema and no cn-sales tables in public", () => {
    expect(migrationSql).toContain("create schema if not exists cn_sales;");
    expect(migrationSql).not.toMatch(/create\s+table\s+public\./i);
  });

  it("schema-qualifies all required cn-sales tables", () => {
    for (const table of requiredTables) {
      expect(migrationSql).toContain(`create table cn_sales.${table}`);
    }
  });

  it("uses cn_sales-prefixed index and important constraint names", () => {
    expect(migrationSql).toContain("constraint cn_sales_ledger_rows_identity_unique");
    expect(migrationSql).toMatch(/create\s+index\s+cn_sales_ledger_rows_company_type_date_idx/i);
    expect(migrationSql).toMatch(/create\s+index\s+cn_sales_customer_links_customer_idx/i);
    expect(migrationSql).not.toMatch(/create\s+index\s+(?!cn_sales_)[a-z_]+/i);
  });

  it("keeps repository queries in cn_sales schema", () => {
    expect(repositoryTs).toContain('schema("cn_sales")');
    expect(repositoryTs).not.toMatch(/this\.supabase\.from\("/);
  });

  it("keeps grants least-privilege for Phase 3-A", () => {
    expect(migrationSql).toContain("grant usage on schema cn_sales to authenticated;");
    expect(migrationSql).toContain("grant usage on schema cn_sales to service_role;");
    expect(migrationSql).not.toMatch(/grant .* to anon/i);
    expect(migrationSql).not.toMatch(/grant select, insert, update, delete on all tables in schema cn_sales to authenticated/i);
    expect(migrationSql).not.toMatch(/insert\s+into\s+storage\.buckets/i);
    expect(migrationSql).not.toMatch(/create\s+policy\s+.*\s+on\s+storage\.objects/i);
    expect(storageSetupSql).toContain("values");
    expect(storageSetupSql).toContain("'cn-sales-ledgers', 'cn-sales-ledgers', false");
    expect(storageSetupSql).toContain("'cn-sales-claim-media', 'cn-sales-claim-media', false");
  });

  it("does not touch existing public or cn_wms_dev tables", () => {
    expect(migrationSql).not.toMatch(/public\.(cnfood_customers|cnfood_products|cnfood_claim_tickets|receivables_ledger|weekly_reports|payment_events|payment_intents|pricing_rules|price_policy_rules|price_policy_groups)/i);
    expect(migrationSql).not.toMatch(/cn_wms_dev\./i);
  });

  it("does not contain destructive SQL", () => {
    expect(migrationSql).not.toMatch(/\b(drop|truncate|delete\s+from|alter\s+table\s+public\.|update\s+public\.)\b/i);
  });

  it("does not directly create pgcrypto in the migration", () => {
    expect(stripSqlComments(migrationSql)).not.toMatch(/^\s*create\s+extension\s+if\s+not\s+exists\s+"?pgcrypto"?\b/im);
    expect(migrationSql).toContain("select gen_random_uuid();");
    expect(phase3bEnvSetup).toContain("select gen_random_uuid();");
    expect(phase3bEnvSetup).toContain('create extension if not exists "pgcrypto" with schema extensions;');
  });
});

function stripSqlComments(sql: string) {
  return sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}
