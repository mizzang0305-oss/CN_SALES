import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const syncScopePlanSource = readFileSync(join(process.cwd(), "src", "lib", "import", "sales-sync-scope-plan.ts"), "utf8");
const importClientSource = readFileSync(join(process.cwd(), "src", "components", "web-import", "sales-import-preview-client.tsx"), "utf8");

describe("sales sync-scope plan static safety", () => {
  it("does not add a sync-scope route or executable write path", () => {
    expect(existsSync(join(process.cwd(), "src", "app", "api", "sales-import", "sync-scope", "route.ts"))).toBe(false);
    expect(syncScopePlanSource).not.toMatch(/\.from\(|insert\(|upsert\(|update\(|delete\(|rpc\(/);
    expect(syncScopePlanSource).not.toContain("createImportService");
    expect(syncScopePlanSource).not.toContain("SupabaseUploadStorageAdapter");
    expect(syncScopePlanSource).not.toContain("limitedInsertLedgerRows");
  });

  it("keeps the plan aggregate-only and no-write", () => {
    expect(syncScopePlanSource).toContain("rawRowsReturned: false");
    expect(syncScopePlanSource).toContain("dbWrite: false");
    expect(syncScopePlanSource).toContain("storageWrite: false");
    expect(syncScopePlanSource).toContain("sync: false");
    expect(syncScopePlanSource).toContain("apply: false");
    expect(syncScopePlanSource).toContain("physicalDelete: false");
    expect(syncScopePlanSource).not.toContain("sampleRows");
    expect(syncScopePlanSource).not.toContain("customerName");
    expect(syncScopePlanSource).not.toContain("productName");
    expect(syncScopePlanSource).not.toContain("rawRowJson");
  });

  it("keeps the import UI in approval-required disabled state", () => {
    expect(importClientSource).toContain('data-sync-disabled="true"');
    expect(importClientSource).toContain("Sync requires approval");
    expect(importClientSource).toContain("Current view sync plan");
    expect(importClientSource).toContain("status: W-5 approval required");
    expect(importClientSource).toContain("physicalDelete: false");
    expect(importClientSource).toContain("syncEnabled: false");
    expect(importClientSource).not.toContain("/api/sales-import/sync-scope");
    expect(importClientSource).not.toContain("runSync");
    expect(importClientSource).not.toContain("rollback");
  });
});
