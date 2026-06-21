import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/sales-import/sync-scope/route";

describe("disabled sales sync-scope API", () => {
  it("returns approval-required without side effects for an empty request", async () => {
    const response = await POST(new Request("http://localhost/api/sales-import/sync-scope", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(423);
    expect(body).toMatchObject({
      ok: false,
      status: "approval_required",
      syncEnabled: false,
      rawRowsReturned: false,
      sideEffects: {
        dbWrite: false,
        storageWrite: false,
        sync: false,
        apply: false,
        physicalDelete: false,
        migration: false,
        seed: false,
        productionPost: false,
      },
    });
    expect(body.requiredApprovals).toMatchObject({
      schema: "WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED",
      execution: "WEB_ERP_XLS_SYNC_EXECUTE_APPROVED",
    });
  });

  it("checks aggregate approval wiring but still does not enable sync", async () => {
    const response = await POST(new Request("http://localhost/api/sales-import/sync-scope", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload()),
    }));
    const body = await response.json();

    expect(response.status).toBe(423);
    expect(body.syncEnabled).toBe(false);
    expect(body.rawRowsReturned).toBe(false);
    expect(body.validation.roleScopeChecked).toBe(true);
    expect(body.validation.roleScopeOk).toBe(true);
    expect(body.validation.approvalContractChecked).toBe(true);
    expect(body.validation.approvalContractOk).toBe(true);
    expect(body.validation.syncPlanChecked).toBe(true);
    expect(body.validation.syncPlanOk).toBe(true);
    expect(body.validation.blockedReasons).toEqual(expect.arrayContaining([
      "SYNC_SCOPE_SCHEMA_APPROVAL_REQUIRED",
      "SYNC_SCOPE_EXECUTION_APPROVAL_REQUIRED",
    ]));
  });

  it("keeps cross-part requests disabled and blocked", async () => {
    const response = await POST(new Request("http://localhost/api/sales-import/sync-scope", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validPayload(), actorRole: "SALES_REP_PART_1", part: "4" }),
    }));
    const body = await response.json();

    expect(response.status).toBe(423);
    expect(body.syncEnabled).toBe(false);
    expect(body.validation.roleScopeOk).toBe(false);
    expect(body.validation.blockedReasons).toContain("SYNC_SCOPE_PART_SCOPE_FORBIDDEN");
  });
});

function validPayload() {
  return {
    workflowGate: "W-6_DISABLED_SYNC_SCOPE_CONTRACT",
    actorRole: "ADMIN",
    part: "4",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-06",
    fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    normalRows: 10,
    excludedRows: 2,
    amountTotal: 20000,
    primaryScopeRows: 10,
    existingScopedRows: 11,
    insertCandidates: 2,
    updateCandidates: 1,
    removedFromCurrentCandidates: 3,
    noChangeRows: 7,
    amountBefore: 12000,
    amountAfter: 20000,
    amountDelta: 8000,
    blockedRows: 0,
    planReady: true,
    rawRowsReturned: false,
  };
}
