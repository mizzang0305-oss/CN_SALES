import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reportPath = join(process.cwd(), "reports", "STAGE_W17_POST_MERGE_CLOSURE_AUDIT.md");

const requiredRoutes = [
  join(process.cwd(), "src", "app", "part", "import-sales", "page.tsx"),
  join(process.cwd(), "src", "app", "(pc)", "admin", "import-audit", "page.tsx"),
  join(process.cwd(), "src", "app", "(pc)", "reports", "weekly", "page.tsx"),
  join(process.cwd(), "src", "app", "(pc)", "reports", "monthly", "page.tsx"),
  join(process.cwd(), "src", "app", "(pc)", "receivables", "page.tsx"),
  join(process.cwd(), "src", "app", "(pc)", "admin", "sales-status", "page.tsx"),
];

const contractSources = [
  join(process.cwd(), "src", "lib", "reports", "weekly-import-report-contract.ts"),
  join(process.cwd(), "src", "lib", "reports", "monthly-import-report-contract.ts"),
  join(process.cwd(), "src", "lib", "receivables", "receivable-dashboard-contract.ts"),
  join(process.cwd(), "src", "lib", "admin", "admin-status-dashboard-contract.ts"),
  join(process.cwd(), "src", "lib", "web-import", "sales-sync-scope-disabled.ts"),
];

describe("W-17 post-merge closure audit", () => {
  it("documents PR #103 through PR #107 merge evidence and final main head", () => {
    expect(existsSync(reportPath)).toBe(true);
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("FINAL_STATUS: W17_POST_MERGE_CLOSURE_AUDIT_READY");
    expect(report).toContain("main HEAD: 91b2c0ef399aa514a2c0da0e391aff6a6171782a");
    expect(report).toContain("PR #103");
    expect(report).toContain("33ecb126a75dcdbf89c4916ce90dc05f9a179e8e");
    expect(report).toContain("PR #104");
    expect(report).toContain("7a7146ffcda9369041bace867278cd44e6f01c9d");
    expect(report).toContain("PR #105");
    expect(report).toContain("c6f6434da74a1e7f48e4e5e769a5da21e9a4e63f");
    expect(report).toContain("PR #106");
    expect(report).toContain("10dc1520287f5e270af05fe1af03ca46f6cc70e5");
    expect(report).toContain("PR #107");
    expect(report).toContain("91b2c0ef399aa514a2c0da0e391aff6a6171782a");
  });

  it("confirms route and aggregate contract inventory is present", () => {
    for (const routePath of requiredRoutes) {
      expect(existsSync(routePath), routePath).toBe(true);
    }
    for (const sourcePath of contractSources) {
      expect(existsSync(sourcePath), sourcePath).toBe(true);
      expect(readFileSync(sourcePath, "utf8")).toContain("rawRowsReturned");
    }

    const receivableSource = readFileSync(join(process.cwd(), "src", "lib", "receivables", "receivable-dashboard-contract.ts"), "utf8");
    expect(receivableSource).toContain("maskedCustomerKey");
    expect(receivableSource).not.toContain("customerName");
    expect(receivableSource).not.toContain("phoneNumber");
    expect(receivableSource).not.toContain("businessNumber");
  });

  it("keeps the merged stack no-write, disabled-sync, and no-secret", () => {
    const report = readFileSync(reportPath, "utf8");
    const runtimeSource = [
      ...requiredRoutes.map((routePath) => readFileSync(routePath, "utf8")),
      ...contractSources.map((sourcePath) => readFileSync(sourcePath, "utf8")),
    ].join("\n");

    expect(report).toContain("schema draft-only: PASS");
    expect(report).toContain("disabled sync-scope: PASS");
    expect(report).toContain("rawRowsReturned=false: PASS");
    expect(report).toContain("masked customer key only: PASS");
    expect(report).toContain("enabled sync/apply button: NO");
    expect(report).toContain("DB write: NO");
    expect(report).toContain("migration apply: NO");
    expect(report).toContain("sync/apply: NO");
    expect(runtimeSource).not.toMatch(/rawRowsReturned:\s*true|rawRows\.map|rawRowJson|sampleRows/);
    expect(runtimeSource).not.toMatch(/runSync\(|runApply\(|runRollback\(|applyEnabled:\s*true/);
    expect(runtimeSource).not.toMatch(/insert\(|upsert\(|delete\(|truncate\s+/);
  });
});
