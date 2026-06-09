import type { UserRole } from "@/lib/types";
import type { ResolveUserScopeInput, ScopeAssignment, ScopeType } from "@/lib/scope/resolve-user-scope";

const roles = new Set<UserRole>(["sales_rep", "part_leader", "team_leader", "executive", "admin"]);
const scopeTypes = new Set<ScopeType>(["company", "team", "part", "sales_rep", "customer"]);

export function getFixtureScopeInput(request: Request): ResolveUserScopeInput {
  const role = parseRole(request.headers.get("x-cn-sales-role"));
  return {
    role,
    userId: request.headers.get("x-cn-sales-user-id") ?? undefined,
    companyId: request.headers.get("x-cn-sales-company-id") ?? undefined,
    teamCode: request.headers.get("x-cn-sales-team") ?? undefined,
    partCode: request.headers.get("x-cn-sales-part") ?? undefined,
    salesRepId: request.headers.get("x-cn-sales-rep") ?? undefined,
    assignments: parseAssignments(request.headers.get("x-cn-sales-scope")),
  };
}

function parseRole(value: string | null): UserRole {
  return value && roles.has(value as UserRole) ? (value as UserRole) : "admin";
}

function parseAssignments(value: string | null): ScopeAssignment[] {
  if (!value) return [];

  const assignments: ScopeAssignment[] = [];
  for (const rawItem of value.split(",")) {
    const item = rawItem.trim();
    if (!item) continue;

    const [type, scopeValue] = item.split(":");
    if (!scopeTypes.has(type as ScopeType) || !scopeValue) continue;
    assignments.push({ scopeType: type as ScopeType, scopeValue, canView: true });
  }
  return assignments;
}
