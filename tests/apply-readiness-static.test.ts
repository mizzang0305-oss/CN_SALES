import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seedSql = readFileSync(join(process.cwd(), "supabase", "seed_phase3a_cn_sales.sql"), "utf8");
const migrationSql = readFileSync(join(process.cwd(), "supabase", "migrations", "0001_initial_mvp.sql"), "utf8");
const storageSetupSql = readFileSync(join(process.cwd(), "supabase", "storage_setup_cn_sales.sql"), "utf8");
const docs = readFileSync(join(process.cwd(), "docs", "phase3b_env_setup.md"), "utf8");

describe("Stage 4-B apply-readiness static checks", () => {
  it("keeps the seed SQL safe for SQL Editor manual replacement", () => {
    const executableSeed = stripSqlComments(seedSql);

    expect(seedSql).toContain("<ADMIN_AUTH_USER_ID>");
    expect(seedSql).not.toContain("00000000-0000-0000-0000-000000000000");
    expect(executableSeed).not.toMatch(/\binsert\s+into\s+auth\.users\b/i);
    expect(seedSql).toContain("auth.users where id = seed_input.admin_auth_user_id");
    expect(seedSql).toContain("full_name");
    expect(seedSql).not.toContain("display_name");
  });

  it("keeps required sales part seeds and idempotent upserts", () => {
    for (const partCode of ["1", "4", "5", "6", "7", "9", "10", "11"]) {
      expect(seedSql).toContain(`'${partCode}'`);
    }
    expect(seedSql.match(/on conflict/gi)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("keeps storage creation out of migrations and in the explicit storage setup draft", () => {
    expect(migrationSql).not.toMatch(/\binsert\s+into\s+storage\.buckets\b/i);
    expect(migrationSql).not.toMatch(/\bon\s+storage\.objects\b/i);
    expect(storageSetupSql).toContain("insert into storage.buckets");
    expect(storageSetupSql).toContain("'cn-sales-ledgers', 'cn-sales-ledgers', false");
    expect(storageSetupSql).toContain("'cn-sales-claim-media', 'cn-sales-claim-media', false");
    expect(storageSetupSql).not.toMatch(/public\)\s*values[\s\S]*true/i);
  });

  it("blocks executable pgcrypto creation while keeping documented pre-check guidance", () => {
    expect(stripSqlComments(migrationSql)).not.toMatch(/^\s*create\s+extension\s+if\s+not\s+exists\s+"?pgcrypto"?\b/im);
    expect(docs).toContain("select gen_random_uuid();");
    expect(docs).toContain('create extension if not exists "pgcrypto" with schema extensions;');
  });

  it("documents SQL Editor sequence and storage approval boundaries", () => {
    expect(docs).toContain("Run `supabase/migrations/0001_initial_mvp.sql`");
    expect(docs).toContain("Run `supabase/migrations/0004_phase4c_scope_mobile_briefing.sql`");
    expect(docs).toContain("Do not create buckets during schema migration apply.");
    expect(docs).toContain("Apply the storage setup SQL only after explicit operator approval.");
  });
});

function stripSqlComments(sql: string) {
  return sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}
