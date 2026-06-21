import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routePaths = {
  weekly: join(process.cwd(), "src", "app", "(pc)", "reports", "weekly", "page.tsx"),
  monthly: join(process.cwd(), "src", "app", "(pc)", "reports", "monthly", "page.tsx"),
  receivables: join(process.cwd(), "src", "app", "(pc)", "receivables", "page.tsx"),
  adminSalesStatus: join(process.cwd(), "src", "app", "(pc)", "admin", "sales-status", "page.tsx"),
  adminImportAudit: join(process.cwd(), "src", "app", "(pc)", "admin", "import-audit", "page.tsx"),
};
const readinessComponentPath = join(process.cwd(), "src", "components", "reports", "reporting-dashboard-readiness.tsx");
const reportPath = join(process.cwd(), "reports", "STAGE_W14_REPORTING_DASHBOARD_READINESS_ROUTES.md");

describe("W-14 reporting dashboard readiness routes", () => {
  it("adds the requested route shells", () => {
    expect(existsSync(routePaths.weekly)).toBe(true);
    expect(existsSync(routePaths.monthly)).toBe(true);
    expect(existsSync(routePaths.receivables)).toBe(true);
    expect(existsSync(routePaths.adminSalesStatus)).toBe(true);
    expect(existsSync(routePaths.adminImportAudit)).toBe(true);

    expect(readFileSync(routePaths.weekly, "utf8")).toContain("WeeklyReportReadiness");
    expect(readFileSync(routePaths.monthly, "utf8")).toContain("MonthlyReportReadiness");
    expect(readFileSync(routePaths.receivables, "utf8")).toContain("ReceivableDashboardReadiness");
    expect(readFileSync(routePaths.adminSalesStatus, "utf8")).toContain("AdminSalesStatusReadiness");
  });

  it("uses aggregate mock view models and displays readiness boundaries", () => {
    const source = readFileSync(readinessComponentPath, "utf8");

    expect(source).toContain("weeklyImportReportMockViewModel");
    expect(source).toContain("monthlyImportReportMockViewModel");
    expect(source).toContain("receivableDashboardMockViewModel");
    expect(source).toContain("adminStatusDashboardMockViewModel");
    expect(source).toContain('data-reporting-dashboard-readiness');
    expect(source).toContain("rawRowsReturned");
    expect(source).toContain("mockDataOnly: true");
    expect(source).toContain("ADMIN all-part aggregate visibility is available.");
    expect(source).toContain("SALES_REP part-scope remains assigned-part only.");
  });

  it("keeps readiness shells no-write, no-sync, and PII-safe", () => {
    const runtimeSources = [
      ...Object.values(routePaths).map((routePath) => readFileSync(routePath, "utf8")),
      readFileSync(readinessComponentPath, "utf8"),
    ].join("\n");
    const report = readFileSync(reportPath, "utf8");
    const combined = `${runtimeSources}\n${report}`;

    expect(combined).toContain("rawRowsReturned=false");
    expect(runtimeSources).not.toMatch(/\.from\(|insert\(|upsert\(|update\(|delete\(|rpc\(/);
    expect(runtimeSources).not.toContain("/api/sales-import/sync-scope");
    expect(runtimeSources).not.toContain("runSync");
    expect(runtimeSources).not.toContain("runApply");
    expect(runtimeSources).not.toContain("enabled sync button: true");
    expect(runtimeSources).not.toContain("customerName");
    expect(runtimeSources).not.toContain("phoneNumber");
    expect(runtimeSources).not.toContain("businessNumber");
    expect(runtimeSources).not.toContain("rawRowJson");
    expect(runtimeSources).not.toContain("production POST executed");
    expect(runtimeSources).not.toContain("supabase db push");
    expect(report).toContain("`supabase db push`: not run");
  });

  it("documents W-14 local-only completion", () => {
    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("FINAL_STATUS: W14_REPORTING_DASHBOARD_READINESS_ROUTES_READY");
    expect(report).toContain("/reports/weekly");
    expect(report).toContain("/reports/monthly");
    expect(report).toContain("/receivables");
    expect(report).toContain("/admin/sales-status");
    expect(report).toContain("/admin/import-audit");
    expect(report).toContain("push/PR/merge/deploy: not performed");
  });
});
