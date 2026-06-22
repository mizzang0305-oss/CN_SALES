import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reportPath = join(process.cwd(), "reports", "STAGE_W21B_SCHEMA_APPLY_TARGET_LINK_BLOCKED.md");

describe("W-21B schema apply target link blocker report", () => {
  it("records the selected target and schema approval without sync approval", () => {
    expect(existsSync(reportPath)).toBe(true);

    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("FINAL_STATUS: BLOCKED_SCHEMA_APPLY_TARGET_LINK_FAILED");
    expect(report).toContain("WEB_ERP_XLS_SYNC_TARGET_PROJECT_SELECTED");
    expect(report).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(report).toContain("sync execute approval phrase: NOT PROVIDED");
    expect(report).toContain("target project ref: cwkjdbllgyojpggjjfhv");
    expect(report).toContain("project name: mizzang0307");
    expect(report).toContain("environment: production");
    expect(report).toContain("region: ap-southeast-2");
  });

  it("blocks schema apply when the selected target cannot be linked", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("link command: `npx supabase link --project-ref cwkjdbllgyojpggjjfhv`");
    expect(report).toContain("link result: FAILED");
    expect(report).toContain("LegacyLinkAuthTokenError");
    expect(report).toContain("Not Found");
    expect(report).toContain("target linked: NO");
    expect(report).toContain("schema apply: NOT RUN");
    expect(report).toContain("`supabase db push`: NOT RUN");
    expect(report).toContain("migration files applied: NONE");
    expect(report).toContain("rollback executed: NO");
  });

  it("keeps data writes, sync execution, and protected files forbidden", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("DB schema write: NO");
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
