import { NextResponse } from "next/server";
import { buildScopeFilterOptions } from "@/lib/scope/scope-filters";
import { getFixtureScopeInput } from "@/lib/scope/fixture-request";
import { resolveUserScope, type ScopeOptionSeed } from "@/lib/scope/resolve-user-scope";
import { customers, dashboardParts } from "@/lib/data/mock";

export async function GET(request: Request) {
  const scope = resolveUserScope(getFixtureScopeInput(request));
  const seed: ScopeOptionSeed = {
    teams: [{ value: "default", label: "전체 팀" }],
    parts: dashboardParts.map((part) => ({ value: part.partCode, label: part.partName, teamCode: "default" })),
    salesReps: customers.map((customer) => ({ value: customer.salesRepName, label: customer.salesRepName, partCode: customer.partCode })),
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      partCode: customer.partCode,
      salesRepId: customer.salesRepName,
      salesRepName: customer.salesRepName,
      teamCode: "default",
      productGroup: "ledger",
    })),
    productGroups: [{ value: "ledger", label: "원장 상품군" }],
  };

  return NextResponse.json({ mode: "fixture", options: buildScopeFilterOptions(scope, seed) });
}
