import type { LedgerSyncDiffPlan } from "@/lib/import/sync-diff";

export interface FinalSyncExpectedState {
  normalRows: number;
  excludedRows: number;
  warningRows: number;
  errorRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  deleteCandidates: number;
  noChangeRows: number;
}

export interface FinalSyncVerificationResult {
  ok: boolean;
  blockedReasons: string[];
  expected: FinalSyncExpectedState;
  actual: FinalSyncExpectedState;
  sourceRowsIncluded: false;
  selectedColumnsOnly: boolean;
  selectStarUsed: boolean;
  dbWriteRequired: false;
}

export const finalSyncExpectedState: FinalSyncExpectedState = {
  normalRows: 2119,
  excludedRows: 275,
  warningRows: 0,
  errorRows: 0,
  existingScopedRows: 2119,
  insertCandidates: 0,
  updateCandidates: 0,
  deleteCandidates: 0,
  noChangeRows: 2119,
};

export function verifyFinalSyncDryRun(input: {
  syncDiff: LedgerSyncDiffPlan;
  expected?: Partial<FinalSyncExpectedState>;
}): FinalSyncVerificationResult {
  const expected = {
    ...finalSyncExpectedState,
    ...input.expected,
  };
  const actual = toFinalSyncState(input.syncDiff);
  const blockedReasons: string[] = [];

  if (!input.syncDiff.planReady) blockedReasons.push("FINAL_PLAN_NOT_READY");
  if (actual.normalRows !== expected.normalRows) blockedReasons.push("FINAL_NORMAL_ROWS_MISMATCH");
  if (actual.excludedRows !== expected.excludedRows) blockedReasons.push("FINAL_EXCLUDED_ROWS_MISMATCH");
  if (actual.warningRows !== expected.warningRows) blockedReasons.push("FINAL_WARNING_ROWS_MISMATCH");
  if (actual.errorRows !== expected.errorRows) blockedReasons.push("FINAL_ERROR_ROWS_MISMATCH");
  if (actual.existingScopedRows !== expected.existingScopedRows) {
    blockedReasons.push("FINAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (actual.insertCandidates !== expected.insertCandidates) blockedReasons.push("FINAL_INSERT_CANDIDATES_PRESENT");
  if (actual.updateCandidates !== expected.updateCandidates) blockedReasons.push("FINAL_UPDATE_CANDIDATES_PRESENT");
  if (actual.deleteCandidates !== expected.deleteCandidates) blockedReasons.push("FINAL_DELETE_CANDIDATES_PRESENT");
  if (actual.noChangeRows !== expected.noChangeRows) blockedReasons.push("FINAL_NO_CHANGE_ROWS_MISMATCH");
  if (!input.syncDiff.readOnlyEvidence.readExecuted || input.syncDiff.readOnlyEvidence.readBlockedReason) {
    blockedReasons.push("FINAL_READ_ONLY_EVIDENCE_MISSING");
  }
  if (!input.syncDiff.readOnlyEvidence.selectedColumnsOnly) blockedReasons.push("FINAL_SELECTED_COLUMNS_ONLY_MISSING");
  if (input.syncDiff.readOnlyEvidence.selectStarUsed) blockedReasons.push("FINAL_SELECT_STAR_USED");
  if (input.syncDiff.safety.dbWriteExecuted) blockedReasons.push("FINAL_DB_WRITE_FLAGGED");
  if (input.syncDiff.safety.deleteExecuted) blockedReasons.push("FINAL_DELETE_FLAGGED");
  if (input.syncDiff.safety.productionPostExecuted) blockedReasons.push("FINAL_PRODUCTION_POST_FLAGGED");

  return {
    ok: blockedReasons.length === 0,
    blockedReasons,
    expected,
    actual,
    sourceRowsIncluded: false,
    selectedColumnsOnly: input.syncDiff.readOnlyEvidence.selectedColumnsOnly,
    selectStarUsed: input.syncDiff.readOnlyEvidence.selectStarUsed,
    dbWriteRequired: false,
  };
}

function toFinalSyncState(syncDiff: LedgerSyncDiffPlan): FinalSyncExpectedState {
  return {
    normalRows: syncDiff.incoming.normalRows,
    excludedRows: syncDiff.incoming.excludedRows,
    warningRows: syncDiff.incoming.warningRows,
    errorRows: syncDiff.incoming.errorRows,
    existingScopedRows: syncDiff.existing.scopedRows,
    insertCandidates: syncDiff.diff.insertCandidates,
    updateCandidates: syncDiff.diff.updateCandidates,
    deleteCandidates: syncDiff.diff.deleteCandidates,
    noChangeRows: syncDiff.diff.noChangeRows,
  };
}
