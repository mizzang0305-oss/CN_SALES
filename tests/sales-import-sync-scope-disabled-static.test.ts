import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "src", "app", "api", "sales-import", "sync-scope", "route.ts"), "utf8");
const helperSource = readFileSync(join(process.cwd(), "src", "lib", "web-import", "sales-sync-scope-disabled.ts"), "utf8");

describe("disabled sales sync-scope static safety", () => {
  it("exposes only the disabled approval-required contract", () => {
    const combined = `${routeSource}\n${helperSource}`;

    expect(combined).toContain("approval_required");
    expect(combined).toContain("syncEnabled: false");
    expect(combined).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(combined).toContain("WEB_ERP_XLS_SYNC_EXECUTE_APPROVED");
    expect(combined).toContain("rawRowsReturned: false");
    expect(combined).toContain("createNoWriteSideEffects");
  });

  it("does not add a runtime DB write, storage, or apply path", () => {
    const combined = `${routeSource}\n${helperSource}`;

    expect(combined).not.toMatch(/\.from\(|insert\(|upsert\(|update\(|delete\(|rpc\(/);
    expect(combined).not.toContain("createImportService");
    expect(combined).not.toContain("SupabaseUploadStorageAdapter");
    expect(combined).not.toContain("limitedInsertLedgerRows");
    expect(combined).not.toContain("supabase db push");
    expect(combined).not.toContain("storage.objects");
  });
});
