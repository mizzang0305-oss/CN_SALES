import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routes = {
  partImportSales: join(process.cwd(), "src", "app", "part", "import-sales", "page.tsx"),
  adminImportAudit: join(process.cwd(), "src", "app", "(pc)", "admin", "import-audit", "page.tsx"),
  weeklyReports: join(process.cwd(), "src", "app", "(pc)", "reports", "weekly", "page.tsx"),
  monthlyReports: join(process.cwd(), "src", "app", "(pc)", "reports", "monthly", "page.tsx"),
  receivables: join(process.cwd(), "src", "app", "(pc)", "receivables", "page.tsx"),
  adminSalesStatus: join(process.cwd(), "src", "app", "(pc)", "admin", "sales-status", "page.tsx"),
};

const readinessLinksPath = join(process.cwd(), "src", "components", "web-import", "web-import-readiness-links.tsx");

describe("W-15 web import route inventory and readiness links", () => {
  it("keeps all requested readiness routes accessible by page files", () => {
    for (const routePath of Object.values(routes)) {
      expect(existsSync(routePath), routePath).toBe(true);
    }
  });

  it("links the readiness routes from the import surface without execution controls", () => {
    expect(existsSync(readinessLinksPath)).toBe(true);

    const pageSource = readFileSync(routes.partImportSales, "utf8");
    const linksSource = readFileSync(readinessLinksPath, "utf8");
    const combined = `${pageSource}\n${linksSource}`;

    expect(pageSource).toContain("WebImportReadinessLinks");
    expect(linksSource).toContain("/part/import-sales");
    expect(linksSource).toContain("/admin/import-audit");
    expect(linksSource).toContain("/reports/weekly");
    expect(linksSource).toContain("/reports/monthly");
    expect(linksSource).toContain("/receivables");
    expect(linksSource).toContain("/admin/sales-status");
    expect(linksSource).toContain("readOnlyLinks: true");
    expect(linksSource).toContain("syncEnabled: false");
    expect(linksSource).toContain("rawRowsReturned=false");

    expect(combined).not.toMatch(/\/api\/sales-import\/sync-scope|runSync|runApply|runRollback/);
    expect(linksSource).not.toMatch(/실행|반영|동기화 실행|DB 적용|마이그레이션 실행/);
    expect(linksSource).not.toMatch(/<button|<Button/);
  });

  it("does not add raw rows, PII fields, DB writes, or migration execution", () => {
    const linksSource = readFileSync(readinessLinksPath, "utf8");
    const pageSource = readFileSync(routes.partImportSales, "utf8");
    const combined = `${linksSource}\n${pageSource}`;

    expect(combined).not.toMatch(/rawRowsReturned:\s*true|rawRows\.map|rawRowJson|sampleRows/);
    expect(combined).not.toMatch(/customerName|productName|phoneNumber|businessNumber/);
    expect(combined).not.toMatch(/\.from\(|insert\(|upsert\(|update\(|delete\(|rpc\(/);
    expect(combined).not.toContain("supabase db push");
    expect(combined).not.toContain("next start");
    expect(combined).not.toContain("production POST");
  });
});
