import { NextResponse } from "next/server";
import { customerDetails } from "@/lib/data/mock";
import { assertScopeAccess } from "@/lib/scope/assert-scope-access";
import { getFixtureScopeInput } from "@/lib/scope/fixture-request";
import { resolveUserScope, toScopeCustomer } from "@/lib/scope/resolve-user-scope";

export async function GET(request: Request) {
  const scope = resolveUserScope(getFixtureScopeInput(request));
  const tasks = Object.values(customerDetails).flatMap((customer) => {
    const access = assertScopeAccess(scope, toScopeCustomer(customer));
    if (!access.ok) return [];
    return customer.promises.map((promise) => ({
      ...promise,
      customerId: customer.id,
      customerName: customer.name,
      partCode: customer.partCode,
    }));
  });

  return NextResponse.json({ mode: "fixture", tasks });
}

export async function POST() {
  return NextResponse.json(
    {
      status: "blocked",
      mode: "fixture_mode",
      blocked_reasons: ["Task writes require approved DB write mode and are blocked in this PR4 shell."],
    },
    { status: 409 },
  );
}
