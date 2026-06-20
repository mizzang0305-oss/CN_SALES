import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dryRunRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "sales-import", "dry-run", "route.ts"), "utf8");
const dryRunHelperSource = readFileSync(join(process.cwd(), "src", "lib", "web-import", "sales-dry-run.ts"), "utf8");
const importClientSource = readFileSync(join(process.cwd(), "src", "components", "web-import", "sales-import-preview-client.tsx"), "utf8");
const existingReaderSource = readFileSync(join(process.cwd(), "src", "lib", "import", "sync-existing-reader.ts"), "utf8");

describe("sales import dry-run static safety", () => {
  it("uses read-only preview and sync diff utilities without write-enabled services", () => {
    expect(dryRunRouteSource).toContain('export const runtime = "nodejs"');
    expect(dryRunRouteSource).toContain("createPreviewOnlyImportService");
    expect(dryRunRouteSource).toContain("readExistingLedgerRowsForSync");
    expect(dryRunRouteSource).toContain("planLedgerSyncDiff");
    expect(dryRunRouteSource).not.toContain("createImportService");
    expect(dryRunRouteSource).not.toContain("SupabaseUploadStorageAdapter");
    expect(dryRunRouteSource).not.toContain("limitedInsertLedgerRows");
    expect(dryRunRouteSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });

  it("keeps dry-run response aggregate-only", () => {
    expect(dryRunHelperSource).toContain("rawRowsReturned: false");
    expect(dryRunHelperSource).toContain("removedFromCurrentCandidates");
    expect(dryRunHelperSource).toContain("physicalDelete: false");
    expect(dryRunHelperSource).not.toContain("sampleRows");
    expect(dryRunHelperSource).not.toContain("customerName");
    expect(dryRunHelperSource).not.toContain("productName");
    expect(dryRunHelperSource).not.toContain("rawRowJson");
  });

  it("adds only dry-run UI behavior and no sync/apply endpoint", () => {
    expect(importClientSource).toContain("/api/sales-import/dry-run");
    expect(importClientSource).not.toContain("/api/uploads/confirm");
    expect(importClientSource).not.toContain("sync-scope");
    expect(importClientSource).not.toContain("rollback");
  });

  it("reads existing amount aggregates without raw row or PII columns", () => {
    expect(existingReaderSource).toContain("sales_amount, receipt_amount, receipt_discount");
    expect(existingReaderSource).not.toContain("raw_row_json");
    expect(existingReaderSource).not.toContain("customer_name");
    expect(existingReaderSource).not.toContain("product_name");
    expect(existingReaderSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });
});
