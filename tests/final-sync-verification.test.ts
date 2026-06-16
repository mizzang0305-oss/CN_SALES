import { describe, expect, it } from "vitest";
import { verifyFinalSyncDryRun } from "@/lib/import/final-sync-verification";
import type { LedgerSyncDiffPlan } from "@/lib/import/sync-diff";

describe("final sync dry-run verification", () => {
  it("passes when the final dry-run shows all scoped rows already synchronized", () => {
    expect(verifyFinalSyncDryRun({ syncDiff: diffPlan() })).toEqual({
      ok: true,
      blockedReasons: [],
      expected: {
        normalRows: 2119,
        excludedRows: 275,
        warningRows: 0,
        errorRows: 0,
        existingScopedRows: 2119,
        insertCandidates: 0,
        updateCandidates: 0,
        deleteCandidates: 0,
        noChangeRows: 2119,
      },
      actual: {
        normalRows: 2119,
        excludedRows: 275,
        warningRows: 0,
        errorRows: 0,
        existingScopedRows: 2119,
        insertCandidates: 0,
        updateCandidates: 0,
        deleteCandidates: 0,
        noChangeRows: 2119,
      },
      sourceRowsIncluded: false,
      selectedColumnsOnly: true,
      selectStarUsed: false,
      dbWriteRequired: false,
    });
  });

  it("fails when insert candidates remain after the final stage", () => {
    const result = verifyFinalSyncDryRun({
      syncDiff: diffPlan({ insertCandidates: 1, noChangeRows: 2118 }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toEqual(expect.arrayContaining([
      "FINAL_INSERT_CANDIDATES_PRESENT",
      "FINAL_NO_CHANGE_ROWS_MISMATCH",
    ]));
  });

  it("fails when update candidates appear after the final stage", () => {
    const result = verifyFinalSyncDryRun({
      syncDiff: diffPlan({ updateCandidates: 1 }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("FINAL_UPDATE_CANDIDATES_PRESENT");
  });

  it("fails when delete candidates appear after the final stage", () => {
    const result = verifyFinalSyncDryRun({
      syncDiff: diffPlan({ deleteCandidates: 1 }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("FINAL_DELETE_CANDIDATES_PRESENT");
  });

  it("fails when the normal row count differs from the approved source workbook", () => {
    const result = verifyFinalSyncDryRun({
      syncDiff: diffPlan({ normalRows: 2118 }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("FINAL_NORMAL_ROWS_MISMATCH");
  });

  it("fails when read-only evidence is missing or select-star evidence appears", () => {
    const result = verifyFinalSyncDryRun({
      syncDiff: diffPlan({ readExecuted: false, selectStarUsed: true }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toEqual(expect.arrayContaining([
      "FINAL_READ_ONLY_EVIDENCE_MISSING",
      "FINAL_SELECT_STAR_USED",
    ]));
  });

  it("returns aggregate evidence without raw row content", () => {
    const resultText = JSON.stringify(verifyFinalSyncDryRun({ syncDiff: diffPlan() }));

    expect(resultText).not.toMatch(/rawRowJson|rawRows|raw_row/i);
  });
});

function diffPlan(
  overrides: Partial<LedgerSyncDiffPlan["diff"]> &
    Partial<LedgerSyncDiffPlan["incoming"]> &
    Partial<Pick<LedgerSyncDiffPlan, "planReady">> &
    {
      readExecuted?: boolean;
      readBlockedReason?: string | null;
      selectedColumnsOnly?: boolean;
      selectStarUsed?: boolean;
    } = {},
): LedgerSyncDiffPlan {
  return {
    scope: { partCode: "11", dateFrom: "2026-06-01", dateTo: "2026-06-06", scopeSource: "explicit-request" },
    planReady: overrides.planReady ?? true,
    blockedReasons: [],
    incoming: {
      normalRows: overrides.normalRows ?? 2119,
      excludedRows: overrides.excludedRows ?? 275,
      warningRows: overrides.warningRows ?? 0,
      errorRows: overrides.errorRows ?? 0,
    },
    existing: { scopedRows: 2119 },
    diff: {
      insertCandidates: overrides.insertCandidates ?? 0,
      updateCandidates: overrides.updateCandidates ?? 0,
      deleteCandidates: overrides.deleteCandidates ?? 0,
      noChangeRows: overrides.noChangeRows ?? 2119,
      duplicateIncomingKeys: overrides.duplicateIncomingKeys ?? 0,
      duplicateExistingKeys: overrides.duplicateExistingKeys ?? 0,
      duplicateIncomingIdentityHashes: overrides.duplicateIncomingIdentityHashes ?? 0,
      duplicateExistingIdentityHashes: overrides.duplicateExistingIdentityHashes ?? 0,
    },
    diagnostics: {
      incomingIdentity: { duplicateKeyCount: 0, duplicateRowCount: 0, maxDuplicateGroupSize: 0, groupsWithSameContentHash: 0, groupsWithMixedContentHash: 0 },
      existingIdentity: { duplicateKeyCount: 0, duplicateRowCount: 0, maxDuplicateGroupSize: 0, groupsWithSameContentHash: 0, groupsWithMixedContentHash: 0 },
      incomingNaturalKey: { duplicateKeyCount: 0, duplicateRowCount: 0, maxDuplicateGroupSize: 0, groupsWithSameContentHash: 0, groupsWithMixedContentHash: 0 },
    },
    safety: { dbWriteExecuted: false, deleteExecuted: false, productionPostExecuted: false },
    readOnlyEvidence: {
      readExecuted: overrides.readExecuted ?? true,
      readBlockedReason: overrides.readBlockedReason ?? null,
      selectedColumnsOnly: overrides.selectedColumnsOnly ?? true,
      selectStarUsed: overrides.selectStarUsed ?? false,
    } as LedgerSyncDiffPlan["readOnlyEvidence"],
  } as LedgerSyncDiffPlan;
}
