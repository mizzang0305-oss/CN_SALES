import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const docPath = join(process.cwd(), "docs", "web-import", "WEB_ERP_XLS_SYNC_EXECUTE_PREFLIGHT.md");
const reportPath = join(process.cwd(), "reports", "STAGE_W19_SYNC_EXECUTE_PREFLIGHT_DISABLED_AUDIT.md");
const disabledContractPath = join(process.cwd(), "src", "lib", "web-import", "sales-sync-scope-disabled.ts");
const routePath = join(process.cwd(), "src", "app", "api", "sales-import", "sync-scope", "route.ts");

describe("W-19 sync execute preflight disabled audit", () => {
  it("documents the explicit sync approval gate while keeping execution disabled", () => {
    expect(existsSync(docPath)).toBe(true);
    expect(existsSync(reportPath)).toBe(true);
    expect(existsSync(disabledContractPath)).toBe(true);
    expect(existsSync(routePath)).toBe(true);

    const doc = readFileSync(docPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("FINAL_STATUS: W19_SYNC_EXECUTE_PREFLIGHT_DISABLED_AUDIT_READY");
    expect(combined).toContain("WEB_ERP_XLS_SYNC_EXECUTE_APPROVED");
    expect(combined).toContain("sync execute allowed now: NO");
    expect(combined).toContain("sync execute: FORBIDDEN");
    expect(combined).toContain("DB write: FORBIDDEN");
    expect(combined).toContain("schema apply remains separate");
    expect(combined).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
  });

  it("keeps the sync-scope endpoint on approval_required disabled behavior", () => {
    const disabledContract = readFileSync(disabledContractPath, "utf8");
    const route = readFileSync(routePath, "utf8");
    const combined = `${disabledContract}\n${route}`;

    expect(combined).toContain("approval_required");
    expect(combined).toContain("createDisabledSalesSyncScopeResponse");
    expect(combined).toContain("rawRowsReturned: false");
    expect(combined).not.toMatch(/syncEnabled:\s*true/);
    expect(combined).not.toMatch(/applyEnabled:\s*true/);
  });

  it("documents removal, raw-row, and enabled-button safety boundaries", () => {
    const doc = readFileSync(docPath, "utf8");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${doc}\n${report}`;

    expect(combined).toContain("enabled sync/apply button: FORBIDDEN");
    expect(combined).toContain("physical delete: FORBIDDEN");
    expect(combined).toContain("removedFromCurrent -> not_in_latest_xls");
    expect(combined).toContain("rawRowsReturned=false");
    expect(combined).toContain("raw row output: FORBIDDEN");
    expect(combined).toContain("PII output: FORBIDDEN");
    expect(combined).toContain("secret/env output: FORBIDDEN");
    expect(combined).not.toMatch(/sync execute allowed now:\s*YES/);
  });
});
