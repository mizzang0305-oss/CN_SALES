import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const previewRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "sales-import", "preview", "route.ts"), "utf8");
const dryRunRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "sales-import", "dry-run", "route.ts"), "utf8");
const importClientSource = readFileSync(join(process.cwd(), "src", "components", "web-import", "sales-import-preview-client.tsx"), "utf8");
const approvalContractSource = readFileSync(join(process.cwd(), "src", "lib", "import", "sales-sync-approval-contract.ts"), "utf8");

describe("web import role scope and approval static contract", () => {
  it("uses the central part-access contract in preview and dry-run APIs", () => {
    expect(previewRouteSource).toContain('@/lib/auth/part-access');
    expect(previewRouteSource).toContain("validateSalesPartAccess");
    expect(dryRunRouteSource).toContain('@/lib/auth/part-access');
    expect(dryRunRouteSource).toContain("validateSalesPartAccess");
  });

  it("keeps sync execution unimplemented", () => {
    expect(existsSync(join(process.cwd(), "src", "app", "api", "sales-import", "sync-scope", "route.ts"))).toBe(false);
    expect(previewRouteSource).not.toContain("syncScope");
    expect(dryRunRouteSource).not.toContain("limitedInsertLedgerRows");
    expect(dryRunRouteSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });

  it("shows only a disabled sync approval state in the UI", () => {
    expect(importClientSource).toContain('data-sync-disabled="true"');
    expect(importClientSource).toContain("Sync requires approval");
    expect(importClientSource).toContain("syncEnabled: false");
    expect(importClientSource).toContain("applyEnabled: false");
    expect(importClientSource).not.toContain("runSync");
    expect(importClientSource).not.toContain("/api/sales-import/sync-scope");
  });

  it("keeps the future approval contract validation-only", () => {
    expect(approvalContractSource).toContain("validateSalesSyncApprovalContract");
    expect(approvalContractSource).toContain("rawRowsReturned: false");
    expect(approvalContractSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });
});
