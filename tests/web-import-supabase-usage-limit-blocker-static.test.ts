import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reportPath = join(process.cwd(), "reports", "STAGE_W21C_SUPABASE_USAGE_LIMIT_BLOCKER.md");

describe("W-21C Supabase usage limit blocker report", () => {
  it("records the selected production target and usage quota blocker", () => {
    expect(existsSync(reportPath)).toBe(true);

    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("FINAL_STATUS: BLOCKED_SUPABASE_USAGE_LIMIT");
    expect(report).toContain("target project ref: cwkjdbllgyojpggjjfhv");
    expect(report).toContain("target project name: mizzang0307");
    expect(report).toContain("environment: production");
    expect(report).toContain("region: ap-southeast-2");
    expect(report).toContain("schema evidence: cn_sales schema visible");
    expect(report).toContain("usage blocker: Database Size 0.786 / 0.5GB, 157%");
    expect(report).toContain("status: exceeded Free Plan quota");
  });

  it("keeps schema approval valid while blocking apply until usage is resolved", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("schema apply approval: WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(report).toContain("schema apply approval valid: YES");
    expect(report).toContain("schema apply executed: NO");
    expect(report).toContain("sync execute approved: NO");
    expect(report).toContain("sync execute executed: NO");
    expect(report).toContain("apply allowed now: NO");
    expect(report).toContain("next required action: resolve Supabase usage limit before schema apply retry");
  });

  it("does not authorize writes, sync execution, deployment, or protected staging", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("supabase db push: NO");
    expect(report).toContain("DB data write: NO");
    expect(report).toContain("sync/apply: NO");
    expect(report).toContain("production POST: NO");
    expect(report).toContain("seed/storage: NO");
    expect(report).toContain("raw row/PII/secret: NO");
    expect(report).toContain("physical delete: NO");
    expect(report).toContain("enabled sync/apply button: NO");
    expect(report).toContain("docs/adsense staged: NO");
    expect(report).toContain("`.codex/config.toml` staged: NO");
  });
});
