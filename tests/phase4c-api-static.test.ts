import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeFiles = [
  ["scope options", "src/app/api/scope/options/route.ts"],
  ["briefing", "src/app/api/customers/[id]/briefing/route.ts"],
  ["recent sales", "src/app/api/customers/[id]/recent-sales/route.ts"],
  ["product usage", "src/app/api/customers/[id]/product-usage/route.ts"],
  ["ar", "src/app/api/customers/[id]/ar/route.ts"],
  ["claims", "src/app/api/customers/[id]/claims/route.ts"],
  ["tasks", "src/app/api/tasks/route.ts"],
  ["task complete", "src/app/api/tasks/[id]/complete/route.ts"],
] as const;

describe("Phase 4-C API and mobile shell static checks", () => {
  it("adds the requested API route shells", () => {
    for (const [, file] of routeFiles) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
  });

  it("guards customer-specific API routes with server-side scope helpers", () => {
    for (const [name, file] of routeFiles.slice(1, 6)) {
      const source = existsSync(join(process.cwd(), file)) ? readFileSync(join(process.cwd(), file), "utf8") : "";
      expect(source, name).toContain("assertScopeAccess");
      expect(source, name).toContain("resolveUserScope");
      expect(source, name).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|service_role|createServiceRoleClient|publicUrl/i);
    }
  });

  it("keeps task write routes in fixture blocked mode", () => {
    const tasksRoute = existsSync(join(process.cwd(), "src/app/api/tasks/route.ts"))
      ? readFileSync(join(process.cwd(), "src/app/api/tasks/route.ts"), "utf8")
      : "";
    const completeRoute = existsSync(join(process.cwd(), "src/app/api/tasks/[id]/complete/route.ts"))
      ? readFileSync(join(process.cwd(), "src/app/api/tasks/[id]/complete/route.ts"), "utf8")
      : "";

    expect(tasksRoute).toContain("fixture_mode");
    expect(tasksRoute).toContain("POST");
    expect(completeRoute).toContain("fixture_mode");
    expect(completeRoute).toContain("PATCH");
  });

  it("exposes mobile customer briefing tabs and safe wording", () => {
    const mobilePage = existsSync(join(process.cwd(), "src/app/m/customers/[id]/page.tsx"))
      ? readFileSync(join(process.cwd(), "src/app/m/customers/[id]/page.tsx"), "utf8")
      : "";
    const detailView = existsSync(join(process.cwd(), "src/components/customers/customer-detail.tsx"))
      ? readFileSync(join(process.cwd(), "src/components/customers/customer-detail.tsx"), "utf8")
      : "";
    const combined = `${mobilePage}\n${detailView}`;

    for (const label of ["요약", "매출", "미수", "상품", "처리 이슈", "방문일지", "약속"]) {
      expect(combined).toContain(label);
    }
    expect(combined).toContain("관리 우선순위");
    expect(combined).toContain("확인 필요 거래처");
    expect(combined).toContain("회입 확인 필요");
    expect(combined).not.toContain("문제 거래처");
    expect(combined).not.toContain("미수 위험");
  });
});
