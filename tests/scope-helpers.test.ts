import { describe, expect, it } from "vitest";
import { assertScopeAccess } from "@/lib/scope/assert-scope-access";
import { buildScopeFilterOptions } from "@/lib/scope/scope-filters";
import { resolveUserScope, type ScopeCustomer, type ScopeOptionSeed } from "@/lib/scope/resolve-user-scope";

const customers: ScopeCustomer[] = [
  { id: "cust-a", name: "Alpha Mart", partCode: "A", salesRepId: "rep-a", salesRepName: "Rep A", productGroup: "fresh" },
  { id: "cust-b", name: "Beta Food", partCode: "B", salesRepId: "rep-b", salesRepName: "Rep B", productGroup: "frozen" },
  { id: "cust-c", name: "Core Kitchen", partCode: "C", salesRepId: "rep-c", salesRepName: "Rep C", productGroup: "fresh" },
];

const optionSeed: ScopeOptionSeed = {
  teams: [{ value: "north", label: "North Team" }],
  parts: [
    { value: "A", label: "Part A", teamCode: "north" },
    { value: "B", label: "Part B", teamCode: "north" },
    { value: "C", label: "Part C", teamCode: "south" },
  ],
  salesReps: [
    { value: "rep-a", label: "Rep A", partCode: "A" },
    { value: "rep-b", label: "Rep B", partCode: "B" },
    { value: "rep-c", label: "Rep C", partCode: "C" },
  ],
  customers,
  productGroups: [
    { value: "fresh", label: "Fresh" },
    { value: "frozen", label: "Frozen" },
  ],
};

describe("scope helpers", () => {
  it("blocks a sales rep from customers outside their explicit scope", () => {
    const scope = resolveUserScope({
      role: "sales_rep",
      salesRepId: "rep-a",
      assignments: [{ scopeType: "customer", scopeValue: "cust-a", canView: true }],
    });

    expect(assertScopeAccess(scope, customers[0])).toMatchObject({ ok: true });
    expect(assertScopeAccess(scope, customers[1])).toMatchObject({ ok: false, reason: "forbidden" });
  });

  it("allows part and team leaders through part-based scope", () => {
    const partLeader = resolveUserScope({ role: "part_leader", partCode: "B" });
    const teamLeader = resolveUserScope({
      role: "team_leader",
      assignments: [
        { scopeType: "part", scopeValue: "A", canView: true },
        { scopeType: "part", scopeValue: "C", canView: true },
      ],
    });

    expect(assertScopeAccess(partLeader, customers[1])).toMatchObject({ ok: true });
    expect(assertScopeAccess(partLeader, customers[0])).toMatchObject({ ok: false });
    expect(assertScopeAccess(teamLeader, customers[0])).toMatchObject({ ok: true });
    expect(assertScopeAccess(teamLeader, customers[2])).toMatchObject({ ok: true });
    expect(assertScopeAccess(teamLeader, customers[1])).toMatchObject({ ok: false });
  });

  it("allows admin and executive scopes to view all customers", () => {
    const admin = resolveUserScope({ role: "admin" });
    const executive = resolveUserScope({ role: "executive" });

    expect(customers.every((customer) => assertScopeAccess(admin, customer).ok)).toBe(true);
    expect(customers.every((customer) => assertScopeAccess(executive, customer).ok)).toBe(true);
  });

  it("does not return unauthorized filter options", () => {
    const scope = resolveUserScope({
      role: "team_leader",
      assignments: [
        { scopeType: "part", scopeValue: "A", canView: true },
        { scopeType: "part", scopeValue: "B", canView: true },
      ],
    });
    const options = buildScopeFilterOptions(scope, optionSeed);

    expect(options.parts.map((part) => part.value)).toEqual(["A", "B"]);
    expect(options.salesReps.map((rep) => rep.value)).toEqual(["rep-a", "rep-b"]);
    expect(options.customers.map((customer) => customer.value)).toEqual(["cust-a", "cust-b"]);
    expect(options.productGroups.map((group) => group.value)).toEqual(["fresh", "frozen"]);
    expect(options.compareBases.map((base) => base.value)).toEqual(["previous_day", "previous_week", "previous_month", "previous_year_month"]);
  });
});
