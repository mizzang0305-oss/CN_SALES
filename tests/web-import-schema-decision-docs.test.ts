import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPlanPath = join(process.cwd(), "docs", "web-import", "WEB_ERP_XLS_SYNC_SCHEMA_PLAN.md");
const approvalPacketPath = join(process.cwd(), "docs", "web-import", "WEB_ERP_XLS_SYNC_EXECUTION_APPROVAL_PACKET.md");
const syncScopeRoutePath = join(process.cwd(), "src", "app", "api", "sales-import", "sync-scope", "route.ts");
const importClientSource = readFileSync(join(process.cwd(), "src", "components", "web-import", "sales-import-preview-client.tsx"), "utf8");

describe("W-5A schema decision and sync approval packet docs", () => {
  it("documents the recommended current-view schema decision without adding a migration", () => {
    expect(existsSync(schemaPlanPath)).toBe(true);
    const schemaPlan = readFileSync(schemaPlanPath, "utf8");

    expect(schemaPlan).toContain("Recommended option: Option B, new current-view schema.");
    expect(schemaPlan).toContain("sales_import_batches");
    expect(schemaPlan).toContain("sales_import_rows");
    expect(schemaPlan).toContain("sales_current_records");
    expect(schemaPlan).toContain("sales_import_change_summaries");
    expect(schemaPlan).toContain("sales_change_audit_logs");
    expect(schemaPlan).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(schemaPlan).toContain("migration applied: no");
    expect(existsSync(join(process.cwd(), "supabase", "migrations", "0005_web_erp_xls_sync_current_view.sql"))).toBe(false);
  });

  it("documents the execution approval packet and keeps sync unapproved", () => {
    expect(existsSync(approvalPacketPath)).toBe(true);
    const approvalPacket = readFileSync(approvalPacketPath, "utf8");

    expect(approvalPacket).toContain("WEB_ERP_XLS_SYNC_EXECUTE_APPROVED");
    expect(approvalPacket).toContain("WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED");
    expect(approvalPacket).toContain("rawRowsReturned: false");
    expect(approvalPacket).toContain("physicalDelete is false");
    expect(approvalPacket).toContain("sync execution approved: no");
    expect(approvalPacket).toContain("DB write implemented: no");
  });

  it("does not add a sync-scope endpoint or enabled sync UI", () => {
    expect(existsSync(syncScopeRoutePath)).toBe(false);
    expect(importClientSource).toContain('data-sync-disabled="true"');
    expect(importClientSource).not.toContain("/api/sales-import/sync-scope");
    expect(importClientSource).not.toContain("runSync");
  });
});
