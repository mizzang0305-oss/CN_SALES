import type { UserRole } from "@/lib/types";

export type ScopeType = "company" | "team" | "part" | "sales_rep" | "customer";

export interface ScopeAssignment {
  scopeType: ScopeType;
  scopeValue: string;
  canView?: boolean;
  canWrite?: boolean;
}

export interface ResolveUserScopeInput {
  userId?: string;
  companyId?: string;
  role: UserRole;
  teamCode?: string | null;
  partCode?: string | null;
  salesRepId?: string | null;
  assignments?: ScopeAssignment[];
}

export interface ResolvedUserScope {
  userId?: string;
  companyId?: string;
  role: UserRole;
  canViewAll: boolean;
  allowedTeamCodes: ReadonlySet<string>;
  allowedPartCodes: ReadonlySet<string>;
  allowedSalesRepIds: ReadonlySet<string>;
  allowedCustomerIds: ReadonlySet<string>;
  writableCustomerIds: ReadonlySet<string>;
}

export interface ScopeCustomer {
  id: string;
  name: string;
  partCode: string;
  salesRepId?: string | null;
  salesRepName?: string | null;
  teamCode?: string | null;
  productGroup?: string | null;
}

export interface ScopeFilterOption {
  value: string;
  label: string;
  teamCode?: string;
  partCode?: string;
}

export interface ScopeOptionSeed {
  teams: ScopeFilterOption[];
  parts: ScopeFilterOption[];
  salesReps: ScopeFilterOption[];
  customers: ScopeCustomer[];
  productGroups: ScopeFilterOption[];
}

export function resolveUserScope(input: ResolveUserScopeInput): ResolvedUserScope {
  const allowedTeamCodes = new Set<string>();
  const allowedPartCodes = new Set<string>();
  const allowedSalesRepIds = new Set<string>();
  const allowedCustomerIds = new Set<string>();
  const writableCustomerIds = new Set<string>();
  let canViewAll = input.role === "admin" || input.role === "executive";

  if (input.teamCode && input.role === "team_leader") allowedTeamCodes.add(input.teamCode);
  if (input.partCode && (input.role === "part_leader" || input.role === "sales_rep")) allowedPartCodes.add(input.partCode);
  if (input.salesRepId && input.role === "sales_rep") allowedSalesRepIds.add(input.salesRepId);

  for (const assignment of input.assignments ?? []) {
    if (assignment.canView === false) continue;
    const value = assignment.scopeValue.trim();
    if (!value) continue;

    if (assignment.scopeType === "company") canViewAll = true;
    if (assignment.scopeType === "team") allowedTeamCodes.add(value);
    if (assignment.scopeType === "part") allowedPartCodes.add(value);
    if (assignment.scopeType === "sales_rep") allowedSalesRepIds.add(value);
    if (assignment.scopeType === "customer") {
      allowedCustomerIds.add(value);
      if (assignment.canWrite) writableCustomerIds.add(value);
    }
  }

  return {
    userId: input.userId,
    companyId: input.companyId,
    role: input.role,
    canViewAll,
    allowedTeamCodes,
    allowedPartCodes,
    allowedSalesRepIds,
    allowedCustomerIds,
    writableCustomerIds,
  };
}

export function toScopeCustomer(customer: {
  id: string;
  name: string;
  partCode: string;
  salesRepName?: string | null;
  productGroup?: string | null;
}): ScopeCustomer {
  return {
    id: customer.id,
    name: customer.name,
    partCode: customer.partCode,
    salesRepId: customer.salesRepName ?? null,
    salesRepName: customer.salesRepName ?? null,
    productGroup: customer.productGroup ?? null,
  };
}
