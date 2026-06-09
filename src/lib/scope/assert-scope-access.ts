import type { ResolvedUserScope, ScopeCustomer } from "@/lib/scope/resolve-user-scope";

export type ScopeAccessResult =
  | { ok: true }
  | { ok: false; reason: "forbidden"; status: 403 };

export function assertScopeAccess(scope: ResolvedUserScope, customer: ScopeCustomer | null | undefined): ScopeAccessResult {
  if (!customer) return { ok: false, reason: "forbidden", status: 403 };
  if (scope.canViewAll) return { ok: true };
  if (scope.allowedCustomerIds.has(customer.id)) return { ok: true };
  if (customer.salesRepId && scope.allowedSalesRepIds.has(customer.salesRepId)) return { ok: true };
  if (scope.allowedPartCodes.has(customer.partCode)) return { ok: true };
  if (customer.teamCode && scope.allowedTeamCodes.has(customer.teamCode)) return { ok: true };
  return { ok: false, reason: "forbidden", status: 403 };
}

export function filterCustomersForScope<T extends ScopeCustomer>(scope: ResolvedUserScope, customers: T[]): T[] {
  return customers.filter((customer) => assertScopeAccess(scope, customer).ok);
}
