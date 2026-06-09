import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(process.cwd(), "supabase", "migrations", "0004_phase4c_scope_mobile_briefing.sql");
const phase4cSql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

describe("Phase 4-C scope and mobile briefing migration static checks", () => {
  it("creates only the cn_sales user scope assignment table", () => {
    expect(phase4cSql).toContain("create table if not exists cn_sales.user_scope_assignments");
    expect(phase4cSql).toContain("company_id uuid not null references cn_sales.companies(id)");
    expect(phase4cSql).toContain("user_id uuid not null references cn_sales.profiles(id)");
    expect(phase4cSql).toContain("scope_type text not null");
    expect(phase4cSql).toContain("scope_value text not null");
    expect(phase4cSql).toContain("can_view boolean not null default true");
    expect(phase4cSql).toContain("can_write boolean not null default false");
    expect(phase4cSql).toContain("check (scope_type in ('company', 'team', 'part', 'sales_rep', 'customer'))");
    expect(phase4cSql).not.toMatch(/create\s+table\s+public\./i);
    expect(phase4cSql).not.toMatch(/\bcn_wms_dev\./i);
  });

  it("enables RLS and avoids anon grants", () => {
    expect(phase4cSql).toContain("alter table cn_sales.user_scope_assignments enable row level security");
    expect(phase4cSql).toContain("grant select on cn_sales.user_scope_assignments to authenticated");
    expect(phase4cSql).toContain("grant all on cn_sales.user_scope_assignments to service_role");
    expect(phase4cSql).not.toMatch(/grant\s+.*\s+to\s+anon/i);
  });

  it("does not write to public ERP or change public/cn_wms_dev schemas", () => {
    expect(phase4cSql).not.toMatch(/\binsert\s+into\s+public\.(products|vendors|order_lines|pricing_rules)\b/i);
    expect(phase4cSql).not.toMatch(/\b(update|delete\s+from)\s+public\.(products|vendors|order_lines|pricing_rules)\b/i);
    expect(phase4cSql).not.toMatch(/\b(create|alter|drop)\s+(table|view|schema)\s+(if\s+(not\s+)?exists\s+)?public\./i);
    expect(phase4cSql).not.toMatch(/\b(create|alter|drop)\s+(table|view|schema)\s+(if\s+(not\s+)?exists\s+)?cn_wms_dev\./i);
    expect(phase4cSql).not.toMatch(/references\s+public\./i);
  });
});
