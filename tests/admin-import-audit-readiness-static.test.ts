import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pagePath = join(process.cwd(), "src", "app", "(pc)", "admin", "import-audit", "page.tsx");
const componentPath = join(process.cwd(), "src", "components", "web-import", "admin-import-audit-readiness.tsx");
const reportPath = join(process.cwd(), "reports", "STAGE_W9_ADMIN_IMPORT_AUDIT_READINESS.md");

describe("admin import audit readiness static contract", () => {
  it("adds an admin import audit route and empty readiness surface", () => {
    expect(existsSync(pagePath)).toBe(true);
    const component = readFileSync(componentPath, "utf8");

    expect(component).toContain('data-admin-import-audit-readiness="empty-state"');
    expect(component).toContain("Upload history");
    expect(component).toContain("Part upload status");
    expect(component).toContain("All supported parts");
    expect(component).toContain("approval required");
  });

  it("keeps admin audit readiness no-write and sync-disabled", () => {
    const combined = `${readFileSync(pagePath, "utf8")}\n${readFileSync(componentPath, "utf8")}`;

    expect(combined).toContain("syncEnabled: false");
    expect(combined).toContain("applyEnabled: false");
    expect(combined).toContain("rollbackEnabled: false");
    expect(combined).toContain("rawRowsReturned: false");
    expect(combined).not.toMatch(/\.from\(|insert\(|upsert\(|update\(|delete\(|rpc\(/);
    expect(combined).not.toContain("/api/sales-import/sync-scope");
    expect(combined).not.toContain("customerName");
    expect(combined).not.toContain("productName");
  });

  it("documents W-9 as local-only readiness work", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("FINAL_STATUS: W9_ADMIN_IMPORT_AUDIT_READINESS_READY");
    expect(report).toContain("DB write: not implemented");
    expect(report).toContain("Sync/apply: not enabled");
    expect(report).toContain("Raw row/PII/secret output: not added");
  });
});
