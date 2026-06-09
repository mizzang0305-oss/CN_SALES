import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(process.cwd(), "supabase", "migrations", "0003_phase4b_claims_media.sql");
const migrationSql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";
const storagePath = join(process.cwd(), "src", "lib", "storage", "claim-media.ts");
const storageTs = existsSync(storagePath) ? readFileSync(storagePath, "utf8") : "";

describe("Phase 4-B claims media migration static checks", () => {
  it("adds claim media, resolution history, and product solution guide structures in cn_sales only", () => {
    expect(migrationSql).toContain("alter table if exists cn_sales.claims");
    expect(migrationSql).toContain("create table if not exists cn_sales.claim_media_attachments");
    expect(migrationSql).toContain("create table if not exists cn_sales.claim_resolution_history");
    expect(migrationSql).toContain("create table if not exists cn_sales.product_solution_guides");
    expect(migrationSql).toContain("storage_bucket text not null default 'cn-sales-claim-media'");
    expect(migrationSql).toContain("storage_path text not null");
    expect(migrationSql).toContain("media_type text not null check (media_type in ('image', 'video', 'file'))");
  });

  it("extends claims for resolution workflow without public or cn_wms_dev DDL", () => {
    for (const column of ["product_id", "sales_rep_id", "issue_type", "final_resolution", "resolved_at", "resolved_by", "solution_guide_id"]) {
      expect(migrationSql).toContain(`add column if not exists ${column}`);
    }
    expect(migrationSql).not.toMatch(/create\s+table\s+public\./i);
    expect(migrationSql).not.toMatch(/\b(alter|drop|create)\s+(table|view|schema)\s+(if\s+exists\s+|if\s+not\s+exists\s+)?public\./i);
    expect(migrationSql).not.toMatch(/\bcn_wms_dev\./i);
  });

  it("does not create buckets, store public URLs, or write public ERP tables", () => {
    expect(migrationSql).not.toMatch(/insert\s+into\s+storage\.buckets/i);
    expect(migrationSql).not.toMatch(/public_url|publicUrl|getPublicUrl/i);
    expect(migrationSql).not.toMatch(/\b(insert\s+into|update|delete\s+from)\s+public\.(products|vendors|order_lines|pricing_rules)\b/i);
    expect(migrationSql).not.toMatch(/references\s+public\./i);
  });
});

describe("claim media storage helper static checks", () => {
  it("keeps claim media on private bucket path metadata only", () => {
    expect(storageTs).toContain('CLAIM_MEDIA_BUCKET = "cn-sales-claim-media"');
    expect(storageTs).toContain("createClaimMediaStoragePath");
    expect(storageTs).toContain("sanitizeClaimMediaFileName");
    expect(storageTs).not.toMatch(/getPublicUrl|publicUrl/i);
  });
});
