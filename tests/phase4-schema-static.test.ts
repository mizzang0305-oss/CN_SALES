import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const phase4Sql = readFileSync(join(process.cwd(), "supabase", "migrations", "0002_phase4a_master_data.sql"), "utf8");

const phase4Tables = [
  "customer_aliases",
  "product_aliases",
  "master_merge_candidates",
  "customer_product_usage",
  "erp_customer_links",
  "erp_product_links",
  "erp_match_candidates",
];

describe("Phase 4-A master-data schema migration static checks", () => {
  it("keeps Phase 4-A schema changes additive and inside cn_sales", () => {
    expect(phase4Sql).toContain("alter table cn_sales.sales_parts");
    expect(phase4Sql).toContain("alter table cn_sales.customers");
    expect(phase4Sql).toContain("alter table cn_sales.products");
    expect(phase4Sql).not.toMatch(/create\s+table\s+public\./i);
    expect(phase4Sql).not.toMatch(/\bcn_wms_dev\./i);
  });

  it("creates Phase 4-A master, alias, usage, and ERP mapping tables", () => {
    for (const table of phase4Tables) {
      expect(phase4Sql).toContain(`create table if not exists cn_sales.${table}`);
    }
  });

  it("adds raw and normalized ledger-derived master-data columns", () => {
    expect(phase4Sql).toContain("add column if not exists source text not null default 'ledger'");
    expect(phase4Sql).toContain("add column if not exists raw_customer_name text");
    expect(phase4Sql).toContain("add column if not exists normalized_customer_name text");
    expect(phase4Sql).toContain("add column if not exists raw_product_name text");
    expect(phase4Sql).toContain("add column if not exists normalized_product_name text");
  });

  it("adds ERP mapping tables without direct public foreign keys", () => {
    expect(phase4Sql).toContain("create table if not exists cn_sales.erp_customer_links");
    expect(phase4Sql).toContain("cn_sales_customer_id uuid not null references cn_sales.customers(id) on delete cascade");
    expect(phase4Sql).toContain("erp_vendor_code text not null");
    expect(phase4Sql).toContain("match_type text not null check (match_type in ('exact_name', 'normalized_name', 'biz_no', 'manual'))");
    expect(phase4Sql).toContain("create table if not exists cn_sales.erp_product_links");
    expect(phase4Sql).toContain("cn_sales_product_id uuid not null references cn_sales.products(id) on delete cascade");
    expect(phase4Sql).toContain("erp_product_code text not null");
    expect(phase4Sql).toContain("erp_barcode text");
    expect(phase4Sql).toContain("create table if not exists cn_sales.erp_match_candidates");
    expect(phase4Sql).toContain("status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected'))");
    expect(phase4Sql).not.toMatch(/references\s+public\./i);
  });

  it("enables RLS and avoids anon grants for every new cn_sales table", () => {
    for (const table of phase4Tables) {
      expect(phase4Sql).toContain(`alter table cn_sales.${table} enable row level security`);
    }
    expect(phase4Sql).not.toMatch(/grant\s+.*\s+to\s+anon/i);
  });

  it("keeps destructive SQL and public ERP writes out of Phase 4-A migration", () => {
    expect(phase4Sql).not.toMatch(/\b(drop|truncate|delete\s+from|alter\s+table\s+public\.|update\s+public\.)\b/i);
    expect(phase4Sql).not.toMatch(/\bforce\s+row\s+level\s+security\b/i);
    expect(phase4Sql).not.toMatch(/\binsert\s+into\s+public\.(products|vendors|order_lines|pricing_rules)\b/i);
    expect(phase4Sql).not.toMatch(/\b(update|delete\s+from)\s+public\.(products|vendors|order_lines|pricing_rules)\b/i);
    expect(phase4Sql).not.toMatch(/\b(create|alter|drop)\s+(table|view|schema)\s+(if\s+(not\s+)?exists\s+)?public\./i);
  });
});
