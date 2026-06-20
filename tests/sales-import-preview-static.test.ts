import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const salesPreviewRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "sales-import", "preview", "route.ts"), "utf8");
const salesPreviewClientSource = readFileSync(join(process.cwd(), "src", "components", "web-import", "sales-import-preview-client.tsx"), "utf8");
const salesPreviewHelperSource = readFileSync(join(process.cwd(), "src", "lib", "web-import", "sales-preview.ts"), "utf8");

describe("sales import preview static safety", () => {
  it("uses the preview-only import service and avoids write-enabled paths", () => {
    expect(salesPreviewRouteSource).toContain('export const runtime = "nodejs"');
    expect(salesPreviewRouteSource).toContain("createPreviewOnlyImportService");
    expect(salesPreviewRouteSource).toContain("hashUploadFile");
    expect(salesPreviewRouteSource).toContain("toOperationalPreviewSummary");
    expect(salesPreviewRouteSource).not.toContain("createImportService");
    expect(salesPreviewRouteSource).not.toContain("SupabaseUploadStorageAdapter");
    expect(salesPreviewRouteSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });

  it("keeps the API response aggregate-only", () => {
    expect(salesPreviewHelperSource).toContain("rawRowsReturned: false");
    expect(salesPreviewHelperSource).toContain("dbWrite: false");
    expect(salesPreviewHelperSource).toContain("storageWrite: false");
    expect(salesPreviewHelperSource).toContain("sync: false");
    expect(salesPreviewHelperSource).toContain("apply: false");
    expect(salesPreviewHelperSource).not.toContain("sampleRows:");
    expect(salesPreviewHelperSource).not.toContain("customerName");
    expect(salesPreviewHelperSource).not.toContain("productName");
    expect(salesPreviewHelperSource).not.toContain("rawRowJson");
  });

  it("keeps the W-1 screen preview-only", () => {
    expect(salesPreviewClientSource).toContain("/api/sales-import/preview");
    expect(salesPreviewClientSource).toContain('accept=".xls,.xlsx"');
    expect(salesPreviewClientSource).not.toContain("/api/uploads/confirm");
    expect(salesPreviewClientSource).not.toContain("rollback");
    expect(salesPreviewClientSource).not.toContain("sync-scope");
  });
});
