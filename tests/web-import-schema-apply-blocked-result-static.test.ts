import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reportPath = join(process.cwd(), "reports", "STAGE_W21_SCHEMA_APPLY_APPROVED_EXECUTION.md");

describe("W-21 schema apply blocked preflight result", () => {
  it("records the approved phrase but blocks schema apply before execution", () => {
    expect(existsSync(reportPath)).toBe(true);

    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("FINAL_STATUS: BLOCKED_SCHEMA_APPLY_PREFLIGHT_FAILED");
    expect(report).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(report).toContain("approved scope: schema migration apply only");
    expect(report).toContain("sync execute approved: NO");
    expect(report).toContain("XLS data apply approved: NO");
  });

  it("captures the hard blockers without exposing secrets or row data", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("target DB clarity: BLOCKED");
    expect(report).toContain("linked Supabase project: none");
    expect(report).toContain("candidate projects found: 2");
    expect(report).toContain("policy readiness: BLOCKED");
    expect(report).toContain("create policy statements: 0");
    expect(report).toContain("migration apply executed: NO");
    expect(report).toContain("rollback executed: NO");
    expect(report).not.toMatch(/password|service_role|SUPABASE_[A-Z0-9_]+\s*=|sk-[A-Za-z0-9]/);
  });

  it("keeps sync, data writes, and production operations forbidden", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("DB schema write: NO");
    expect(report).toContain("DB data write: NO");
    expect(report).toContain("sync/apply: NO");
    expect(report).toContain("production POST: NO");
    expect(report).toContain("seed/storage: NO");
    expect(report).toContain("raw row/PII/secret: NO");
    expect(report).toContain("physical delete: NO");
    expect(report).toContain("enabled sync/apply button: NO");
  });
});
