import { NextResponse } from "next/server";
import { buildMobileCustomerBriefing } from "@/lib/customer-briefing/briefing";
import { customerDetails } from "@/lib/data/mock";
import { assertScopeAccess } from "@/lib/scope/assert-scope-access";
import { getFixtureScopeInput } from "@/lib/scope/fixture-request";
import { resolveUserScope, toScopeCustomer } from "@/lib/scope/resolve-user-scope";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = customerDetails[id];
  if (!customer) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const scope = resolveUserScope(getFixtureScopeInput(request));
  const access = assertScopeAccess(scope, toScopeCustomer(customer));
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: access.status });

  return NextResponse.json({ mode: "fixture", productUsage: buildMobileCustomerBriefing(customer).productUsage });
}
