import { describe, expect, it } from "vitest";
import {
  buildSalesSyncScopePlan,
  createNoWriteSideEffects,
  createSalesCurrentViewPolicy,
  type SalesSyncScopeDryRunInput,
} from "@/lib/import/sales-sync-scope-plan";
import type { SalesSyncApprovalContract } from "@/lib/import/sales-sync-approval-contract";

describe("sales sync-scope current view plan", () => {
  it("returns an aggregate-only no-write plan and result preview", () => {
    const result = buildSalesSyncScopePlan({
      approval: validApproval(),
      dryRun: validDryRun(),
    });

    expect(result.ok).toBe(true);
    expect(result.blockedReasons).toEqual([]);
    expect(result.plan).toMatchObject({
      workflowGate: "W-5_EXPLICIT_SYNC_SCOPE_APPROVAL",
      part: "4",
      primaryScopeRows: 10,
      existingScopedRows: 11,
      insertCandidates: 2,
      updateCandidates: 1,
      removedFromCurrentCandidates: 3,
      noChangeRows: 7,
      rawRowsReturned: false,
      planReady: true,
    });
    expect(result.resultPreview).toMatchObject({
      insertedCount: 2,
      updatedCount: 1,
      removedFromCurrentCount: 3,
      noChangeCount: 7,
      auditLogCreated: false,
      rawRowsReturned: false,
    });
    expect(result.sideEffects).toEqual(createNoWriteSideEffects());
    expect(result.currentViewPolicy).toEqual(createSalesCurrentViewPolicy());
  });

  it("does not treat update or removed-from-current candidates as blockers", () => {
    const result = buildSalesSyncScopePlan({
      approval: validApproval({ expectedUpdateCandidates: 4, expectedRemovedFromCurrentCandidates: 5, expectedNoChangeRows: 4 }),
      dryRun: validDryRun({ updateCandidates: 4, removedFromCurrentCandidates: 5, noChangeRows: 4 }),
    });

    expect(result.ok).toBe(true);
    expect(result.currentViewPolicy.update).toBe("changed_by_latest_xls");
    expect(result.currentViewPolicy.removedFromCurrent).toBe("mark_not_in_latest_xls");
    expect(result.currentViewPolicy.physicalDelete).toBe(false);
  });

  it("rejects raw rows, unready dry-run plans, and blocked rows", () => {
    const result = buildSalesSyncScopePlan({
      approval: validApproval(),
      dryRun: validDryRun({
        rawRowsReturned: true,
        planReady: false,
        blockedRows: 1,
        blockedReasons: ["HAS_ERROR_ROWS"],
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.plan).toBeNull();
    expect(result.resultPreview).toBeNull();
    expect(result.blockedReasons).toContain("SYNC_PLAN_RAW_ROWS_RETURNED_MUST_BE_FALSE");
    expect(result.blockedReasons).toContain("SYNC_PLAN_NOT_READY");
    expect(result.blockedReasons).toContain("SYNC_PLAN_BLOCKED_ROWS_PRESENT");
    expect(result.blockedReasons).toContain("DRY_RUN_HAS_ERROR_ROWS");
  });

  it("enforces role scope through the W-3 approval contract", () => {
    expect(buildSalesSyncScopePlan({
      approval: validApproval({ actorRole: "SALES_REP_PART_1" }),
      dryRun: validDryRun(),
    }).blockedReasons).toContain("APPROVAL_PART_SCOPE_FORBIDDEN");

    expect(buildSalesSyncScopePlan({
      approval: validApproval({ actorRole: "PART_LEAD" }),
      dryRun: validDryRun(),
      actorManagedParts: ["4"],
    }).ok).toBe(true);

    expect(buildSalesSyncScopePlan({
      approval: validApproval({ actorRole: "PART_LEAD" }),
      dryRun: validDryRun(),
      actorManagedParts: ["1"],
    }).blockedReasons).toContain("APPROVAL_PART_SCOPE_FORBIDDEN");
  });

  it("blocks file hash, period, amount, and count drift before any sync execution", () => {
    const result = buildSalesSyncScopePlan({
      approval: validApproval({
        fileHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        periodStart: "2026-06-07",
        expectedInsertCandidates: 9,
        expectedAmountDelta: 999,
      }),
      dryRun: validDryRun(),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("APPROVAL_FILE_HASH_MISMATCH");
    expect(result.blockedReasons).toContain("APPROVAL_PERIOD_START_MISMATCH");
    expect(result.blockedReasons).toContain("APPROVAL_INSERT_CANDIDATES_MISMATCH");
    expect(result.blockedReasons).toContain("APPROVAL_AMOUNT_DELTA_MISMATCH");
  });

  it("validates scope arithmetic", () => {
    const result = buildSalesSyncScopePlan({
      approval: validApproval({ expectedNoChangeRows: 8 }),
      dryRun: validDryRun({ noChangeRows: 8 }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("SYNC_PLAN_SCOPE_COUNT_MISMATCH");
  });
});

function validApproval(overrides: Partial<SalesSyncApprovalContract> = {}): SalesSyncApprovalContract {
  return {
    workflowGate: "W-5_EXPLICIT_SYNC_SCOPE_APPROVAL",
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
    expectedExistingScopedRowsBeforeSync: 11,
    expectedInsertCandidates: 2,
    expectedUpdateCandidates: 1,
    expectedRemovedFromCurrentCandidates: 3,
    expectedNoChangeRows: 7,
    expectedAmountBefore: 12000,
    expectedAmountAfter: 20000,
    expectedAmountDelta: 8000,
    rawRowsReturned: false,
    ...overrides,
  };
}

function validDryRun(overrides: Partial<SalesSyncScopeDryRunInput> = {}): SalesSyncScopeDryRunInput {
  return {
    part: "4",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-06",
    fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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
    blockedReasons: [],
    ...overrides,
  };
}
