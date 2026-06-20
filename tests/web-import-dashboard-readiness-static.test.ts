import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const importClientSource = readFileSync(join(process.cwd(), "src", "components", "web-import", "sales-import-preview-client.tsx"), "utf8");
const reportSource = readFileSync(join(process.cwd(), "reports", "STAGE_W7_IMPORT_DASHBOARD_READINESS_LOCAL.md"), "utf8");

describe("web import dashboard readiness state", () => {
  it("shows local-only readiness guidance without enabling sync", () => {
    expect(importClientSource).toContain('data-readiness-state="local-only-disabled-sync"');
    expect(importClientSource).toContain("Import readiness");
    expect(importClientSource).toContain("ADMIN all-part preview and dry-run are allowed for supported parts.");
    expect(importClientSource).toContain("SALES_REP_PART_N preview and dry-run are limited to the assigned part.");
    expect(importClientSource).toContain("rawRowsReturned: false");
    expect(importClientSource).toContain("syncEnabled: false");
    expect(importClientSource).toContain("stage: W-6 disabled sync contract");
    expect(importClientSource).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED required");
    expect(importClientSource).toContain("WEB_ERP_XLS_SYNC_EXECUTE_APPROVED required");
  });

  it("keeps the UI from calling sync, apply, rollback, or raw row flows", () => {
    expect(importClientSource).toContain('data-sync-disabled="true"');
    expect(importClientSource).not.toContain("/api/sales-import/sync-scope");
    expect(importClientSource).not.toContain("runSync");
    expect(importClientSource).not.toContain("runApply");
    expect(importClientSource).not.toContain("rollback");
    expect(importClientSource).not.toContain("rawRows.map");
    expect(importClientSource).not.toContain("customerName");
    expect(importClientSource).not.toContain("productName");
  });

  it("documents W-7 as local-only readiness work", () => {
    expect(reportSource).toContain("FINAL_STATUS: W7_IMPORT_DASHBOARD_READINESS_LOCAL_READY");
    expect(reportSource).toContain("Sync button: disabled");
    expect(reportSource).toContain("Sync endpoint call from UI: not added");
    expect(reportSource).toContain("PR #103 checks must recover and merge");
  });
});
