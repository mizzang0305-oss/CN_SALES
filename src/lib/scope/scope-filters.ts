import { filterCustomersForScope } from "@/lib/scope/assert-scope-access";
import type { ResolvedUserScope, ScopeFilterOption, ScopeOptionSeed } from "@/lib/scope/resolve-user-scope";

export const periodOptions: ScopeFilterOption[] = [
  { value: "30d", label: "30일" },
  { value: "60d", label: "60일" },
  { value: "90d", label: "90일" },
];

export const compareBasisOptions: ScopeFilterOption[] = [
  { value: "previous_day", label: "전일" },
  { value: "previous_week", label: "전주" },
  { value: "previous_month", label: "전월" },
  { value: "previous_year_month", label: "전년동월" },
];

export function buildScopeFilterOptions(scope: ResolvedUserScope, seed: ScopeOptionSeed) {
  const allowedCustomers = filterCustomersForScope(scope, seed.customers);
  const allowedPartCodes = new Set(allowedCustomers.map((customer) => customer.partCode));
  const allowedSalesRepIds = new Set(allowedCustomers.map((customer) => customer.salesRepId).filter(isDefined));
  const allowedProductGroups = new Set(allowedCustomers.map((customer) => customer.productGroup).filter(isDefined));

  const parts = scope.canViewAll
    ? seed.parts
    : seed.parts.filter((part) => allowedPartCodes.has(part.value) || (part.teamCode ? scope.allowedTeamCodes.has(part.teamCode) : false));

  const partCodes = new Set(parts.map((part) => part.value));
  const salesReps = scope.canViewAll
    ? seed.salesReps
    : seed.salesReps.filter((rep) => allowedSalesRepIds.has(rep.value) || (rep.partCode ? partCodes.has(rep.partCode) : false));

  const productGroups = scope.canViewAll
    ? seed.productGroups
    : seed.productGroups.filter((group) => allowedProductGroups.has(group.value));

  return {
    teams: scope.canViewAll ? seed.teams : seed.teams.filter((team) => scope.allowedTeamCodes.has(team.value)),
    parts,
    salesReps,
    customers: allowedCustomers.map((customer) => ({ value: customer.id, label: customer.name, partCode: customer.partCode })),
    productGroups,
    periods: periodOptions,
    compareBases: compareBasisOptions,
  };
}

function isDefined(value: string | null | undefined): value is string {
  return Boolean(value);
}
