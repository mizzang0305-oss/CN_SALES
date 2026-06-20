import { describe, expect, it } from "vitest";
import { validateSalesSyncApprovalContract, type SalesSyncApprovalContract } from "@/lib/import/sales-sync-approval-contract";

describe("future sales sync approval contract", () => {
  it("validates aggregate approval fields without authorizing sync execution", () => {
    const contract = validContract();

    expect(validateSalesSyncApprovalContract(contract, {
      workflowGate: "W-4_EXPLICIT_SYNC_APPROVAL",
      part: "4",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      normalRows: 10,
      expectedInsertCandidates: 2,
      expectedAmountDelta: 8000,
    })).toEqual({ ok: true, blockedReasons: [] });
  });

  it("rejects rawRowsReturned true", () => {
    const contract = { ...validContract(), rawRowsReturned: true };

    expect(validateSalesSyncApprovalContract(contract).blockedReasons).toContain("APPROVAL_RAW_ROWS_RETURNED_MUST_BE_FALSE");
  });

  it("rejects part, file hash, and period mismatches", () => {
    const result = validateSalesSyncApprovalContract(validContract(), {
      part: "11",
      fileHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      periodStart: "2026-06-07",
    });

    expect(result.blockedReasons).toContain("APPROVAL_PART_MISMATCH");
    expect(result.blockedReasons).toContain("APPROVAL_FILE_HASH_MISMATCH");
    expect(result.blockedReasons).toContain("APPROVAL_PERIOD_START_MISMATCH");
  });

  it("rejects negative counts and invalid amount deltas", () => {
    const result = validateSalesSyncApprovalContract({
      ...validContract(),
      normalRows: -1,
      expectedInsertCandidates: -1,
      expectedAmountDelta: 999,
    });

    expect(result.blockedReasons).toContain("APPROVAL_NORMAL_ROWS_INVALID");
    expect(result.blockedReasons).toContain("APPROVAL_INSERT_CANDIDATES_INVALID");
    expect(result.blockedReasons).toContain("APPROVAL_AMOUNT_DELTA_MISMATCH");
  });

  it("rejects actor roles outside their part scope", () => {
    expect(validateSalesSyncApprovalContract({ ...validContract(), actorRole: "SALES_REP_PART_1" }).blockedReasons)
      .toContain("APPROVAL_PART_SCOPE_FORBIDDEN");
    expect(validateSalesSyncApprovalContract({ ...validContract(), actorRole: "PART_LEAD" }, { actorManagedParts: ["4"] }).ok)
      .toBe(true);
    expect(validateSalesSyncApprovalContract({ ...validContract(), actorRole: "PART_LEAD" }, { actorManagedParts: ["1"] }).blockedReasons)
      .toContain("APPROVAL_PART_SCOPE_FORBIDDEN");
  });
});

function validContract(): SalesSyncApprovalContract {
  return {
    workflowGate: "W-4_EXPLICIT_SYNC_APPROVAL",
    actorRole: "ADMIN",
    actorId: "actor-1",
    part: "4",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-06",
    fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    normalRows: 10,
    excludedRows: 2,
    amountTotal: 20000,
    expectedPrimaryScopeRows: 10,
    expectedExistingScopedRowsBeforeSync: 8,
    expectedInsertCandidates: 2,
    expectedUpdateCandidates: 1,
    expectedRemovedFromCurrentCandidates: 3,
    expectedNoChangeRows: 4,
    expectedAmountBefore: 12000,
    expectedAmountAfter: 20000,
    expectedAmountDelta: 8000,
    rawRowsReturned: false,
  };
}
