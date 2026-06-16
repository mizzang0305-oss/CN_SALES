import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LedgerSyncDiffPlan, LedgerSyncScope } from "@/lib/import/sync-diff";
import type { LedgerSyncRow } from "@/lib/import/sync-key";
import type { ParsedLedgerRow } from "@/lib/types";

export const G6B_EXPECTED_SOURCE_FILE_HASH =
  "sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0";

export type LimitedApplyStage = "G-6B" | "G-6D" | "G-6E" | "G-6F" | "G-6G";

export interface LimitedApplyStageConfig {
  stage: LimitedApplyStage;
  approvalFileName: string;
  expectedMaxRows: number;
  expectedExistingScopedRows: number;
  expectedInsertCandidates: number;
  expectedNoChangeRows: number;
}

export const limitedApplyStageConfigs: Record<LimitedApplyStage, LimitedApplyStageConfig> = {
  "G-6B": {
    stage: "G-6B",
    approvalFileName: "g6b_limited_apply_approval.json",
    expectedMaxRows: 3,
    expectedExistingScopedRows: 0,
    expectedInsertCandidates: 2119,
    expectedNoChangeRows: 0,
  },
  "G-6D": {
    stage: "G-6D",
    approvalFileName: "g6d_limited_apply_approval.json",
    expectedMaxRows: 30,
    expectedExistingScopedRows: 3,
    expectedInsertCandidates: 2116,
    expectedNoChangeRows: 3,
  },
  "G-6E": {
    stage: "G-6E",
    approvalFileName: "g6e_limited_apply_approval.json",
    expectedMaxRows: 100,
    expectedExistingScopedRows: 33,
    expectedInsertCandidates: 2086,
    expectedNoChangeRows: 33,
  },
  "G-6F": {
    stage: "G-6F",
    approvalFileName: "g6f_limited_apply_approval.json",
    expectedMaxRows: 500,
    expectedExistingScopedRows: 133,
    expectedInsertCandidates: 1986,
    expectedNoChangeRows: 133,
  },
  "G-6G": {
    stage: "G-6G",
    approvalFileName: "g6g_limited_apply_approval.json",
    expectedMaxRows: 500,
    expectedExistingScopedRows: 633,
    expectedInsertCandidates: 1486,
    expectedNoChangeRows: 633,
  },
};

export interface LimitedApplyApproval {
  stage: LimitedApplyStage;
  target_part: string | number;
  test_file_hash: string;
  date_from: string;
  date_to: string;
  max_rows: number;
  apply_mode: "limited-apply";
  allowed_operations: string[];
  blocked_operations: string[];
  operator: string;
  rollback_owner: string;
  confirm_db_apply_approved: boolean;
  production_post_approved: boolean;
  migration_seed_storage_approved: boolean;
  delete_approved: boolean;
  update_approved: boolean;
  full_apply_approved?: boolean;
  source_preview?: {
    existingScopedRows?: number;
    insertCandidates?: number;
    noChangeRows?: number;
  };
}

export interface LimitedApplyApprovalValidation {
  ok: boolean;
  blockedReasons: string[];
  approval?: LimitedApplyApproval;
}

export interface LimitedApplyRowSelection {
  row: ParsedLedgerRow;
  syncRow: LedgerSyncRow;
  identityHash: string;
  contentHash: string;
}

export async function loadLimitedApplyApproval(
  stage: LimitedApplyStage = "G-6B",
): Promise<LimitedApplyApprovalValidation> {
  const approvalPath = join(process.cwd(), ".local-approval", limitedApplyStageConfigs[stage].approvalFileName);
  try {
    const contents = (await readFile(approvalPath, "utf8")).replace(/^\uFEFF/, "");
    return validateLimitedApplyApproval(JSON.parse(contents));
  } catch {
    return {
      ok: false,
      blockedReasons: ["APPROVAL_FILE_MISSING_OR_UNREADABLE"],
    };
  }
}

export function validateLimitedApplyApproval(input: unknown): LimitedApplyApprovalValidation {
  if (!isRecord(input)) {
    return { ok: false, blockedReasons: ["APPROVAL_INVALID_JSON"] };
  }

  const approval = input as unknown as LimitedApplyApproval;
  const blockedReasons: string[] = [];
  const targetPart = String(approval.target_part ?? "").trim();
  const config = getLimitedApplyStageConfig(approval.stage);

  if (!config) blockedReasons.push("APPROVAL_STAGE_MISMATCH");
  if (targetPart !== "11") blockedReasons.push("APPROVAL_TARGET_PART_MISMATCH");
  if (approval.test_file_hash !== G6B_EXPECTED_SOURCE_FILE_HASH) blockedReasons.push("APPROVAL_FILE_HASH_MISMATCH");
  if (approval.date_from !== "2026-06-01" || approval.date_to !== "2026-06-06") {
    blockedReasons.push("APPROVAL_DATE_RANGE_MISMATCH");
  }
  if (!config || approval.max_rows !== config.expectedMaxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.apply_mode !== "limited-apply") blockedReasons.push("APPROVAL_MODE_MISMATCH");
  if (!isInsertOnly(approval.allowed_operations)) blockedReasons.push("APPROVAL_ALLOWED_OPERATIONS_NOT_INSERT_ONLY");
  if (!hasBlockedOperations(approval.blocked_operations)) blockedReasons.push("APPROVAL_BLOCKED_OPERATIONS_INCOMPLETE");
  if (!approval.operator) blockedReasons.push("APPROVAL_OPERATOR_MISSING");
  if (!approval.rollback_owner) blockedReasons.push("APPROVAL_ROLLBACK_OWNER_MISSING");
  if (approval.confirm_db_apply_approved !== true) blockedReasons.push("APPROVAL_DB_APPLY_NOT_CONFIRMED");
  if (approval.production_post_approved !== false) blockedReasons.push("APPROVAL_PRODUCTION_POST_ENABLED");
  if (approval.migration_seed_storage_approved !== false) blockedReasons.push("APPROVAL_MIGRATION_SEED_STORAGE_ENABLED");
  if (approval.delete_approved !== false) blockedReasons.push("APPROVAL_DELETE_ENABLED");
  if (approval.update_approved !== false) blockedReasons.push("APPROVAL_UPDATE_ENABLED");
  if (approval.full_apply_approved === true) blockedReasons.push("APPROVAL_FULL_APPLY_ENABLED");

  return {
    ok: blockedReasons.length === 0,
    blockedReasons,
    approval: blockedReasons.length === 0 ? approval : undefined,
  };
}

export function selectLimitedApplyRows(input: {
  rows: ParsedLedgerRow[];
  syncRows: LedgerSyncRow[];
  existingRows: LedgerSyncRow[];
  maxRows: number;
}): LimitedApplyRowSelection[] {
  const existingBySyncKey = new Set(input.existingRows.map((row) => row.syncKey));
  const syncByRowIndex = new Map(input.syncRows.map((row) => [row.rowIndex, row]));

  return input.rows
    .map((row) => ({ row, syncRow: syncByRowIndex.get(row.rowIndex) }))
    .filter((item): item is { row: ParsedLedgerRow; syncRow: LedgerSyncRow } => Boolean(item.syncRow))
    .filter((item) => !existingBySyncKey.has(item.syncRow.syncKey))
    .filter((item) => isIsoDate(item.row.ledgerDate))
    .sort((left, right) => left.row.rowIndex - right.row.rowIndex)
    .slice(0, Math.max(0, input.maxRows))
    .map((item) => ({
      row: item.row,
      syncRow: item.syncRow,
      identityHash: item.syncRow.syncKey,
      contentHash: item.syncRow.syncContentHash,
    }));
}

export function summarizeLimitedApplyDateGuard(selectedRows: LimitedApplyRowSelection[]) {
  return selectedRows.reduce(
    (summary, selection) => {
      summary.checkedRows += 1;
      if (!selection.row.ledgerDate) summary.missingLedgerDateRows += 1;
      if (!isIsoDate(selection.row.ledgerDate)) summary.nonIsoLedgerDateRows += 1;
      return summary;
    },
    {
      checkedRows: 0,
      nonIsoLedgerDateRows: 0,
      missingLedgerDateRows: 0,
    },
  );
}

export function validateLimitedApplyPreconditions(input: {
  approval: LimitedApplyApproval;
  sourceFileHash: string;
  selectedPartCode: string;
  syncDiff: LedgerSyncDiffPlan;
  requestScope?: LedgerSyncScope;
  requireExplicitRequestScope?: boolean;
}): { ok: boolean; blockedReasons: string[] } {
  const approvalValidation = validateLimitedApplyApproval(input.approval);
  const blockedReasons = [...approvalValidation.blockedReasons];
  const targetPart = String(input.approval.target_part).trim();
  const config = getLimitedApplyStageConfig(input.approval.stage);
  const expectedExistingScopedRows = input.approval.source_preview?.existingScopedRows ?? config?.expectedExistingScopedRows;
  const expectedInsertCandidates = input.approval.source_preview?.insertCandidates ?? config?.expectedInsertCandidates;
  const expectedNoChangeRows = input.approval.source_preview?.noChangeRows ?? config?.expectedNoChangeRows;

  if (input.sourceFileHash !== input.approval.test_file_hash) blockedReasons.push("SOURCE_FILE_HASH_MISMATCH");
  if (input.selectedPartCode !== targetPart) blockedReasons.push("TARGET_PART_MISMATCH");
  if (input.requireExplicitRequestScope && input.requestScope?.scopeSource !== "explicit-request") {
    blockedReasons.push("REQUEST_PERIOD_SCOPE_REQUIRED");
  }
  if (
    input.requestScope &&
    (input.requestScope.dateFrom !== input.approval.date_from || input.requestScope.dateTo !== input.approval.date_to)
  ) {
    blockedReasons.push("REQUEST_SCOPE_DATE_MISMATCH");
  }
  if (input.syncDiff.scope.partCode !== targetPart) blockedReasons.push("SYNC_SCOPE_PART_MISMATCH");
  if (input.syncDiff.scope.dateFrom !== input.approval.date_from || input.syncDiff.scope.dateTo !== input.approval.date_to) {
    blockedReasons.push("SYNC_SCOPE_DATE_MISMATCH");
  }
  if (!input.syncDiff.planReady) blockedReasons.push("SYNC_PLAN_NOT_READY");
  if (!input.syncDiff.readOnlyEvidence.readExecuted || input.syncDiff.readOnlyEvidence.readBlockedReason) {
    blockedReasons.push("SYNC_DIFF_READ_BLOCKED");
  }
  if (input.syncDiff.incoming.warningRows > 0) blockedReasons.push("WARNING_ROWS_PRESENT");
  if (input.syncDiff.incoming.errorRows > 0) blockedReasons.push("ERROR_ROWS_PRESENT");
  if (expectedExistingScopedRows === undefined || input.syncDiff.existing.scopedRows !== expectedExistingScopedRows) {
    blockedReasons.push("EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (expectedInsertCandidates === undefined || input.syncDiff.diff.insertCandidates !== expectedInsertCandidates) {
    blockedReasons.push("INSERT_CANDIDATES_MISMATCH");
  }
  if (input.syncDiff.diff.updateCandidates > 0) blockedReasons.push("UPDATE_CANDIDATE_PRESENT");
  if (input.syncDiff.diff.deleteCandidates > 0) blockedReasons.push("DELETE_CANDIDATE_PRESENT");
  if (expectedNoChangeRows === undefined || input.syncDiff.diff.noChangeRows !== expectedNoChangeRows) {
    blockedReasons.push("NO_CHANGE_ROWS_MISMATCH");
  }
  if (input.syncDiff.diff.duplicateIncomingIdentityHashes > 0) {
    blockedReasons.push("DUPLICATE_INCOMING_IDENTITY_HASHES_PRESENT");
  }
  if (input.syncDiff.diff.duplicateExistingIdentityHashes > 0) {
    blockedReasons.push("DUPLICATE_EXISTING_IDENTITY_HASHES_PRESENT");
  }
  if (input.syncDiff.diff.insertCandidates < input.approval.max_rows) blockedReasons.push("INSERT_CANDIDATES_BELOW_LIMIT");

  return {
    ok: blockedReasons.length === 0,
    blockedReasons,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isLimitedApplyStage(value: string): value is LimitedApplyStage {
  return value === "G-6B" || value === "G-6D" || value === "G-6E" || value === "G-6F" || value === "G-6G";
}

export function getLimitedApplyStageConfig(stage: unknown): LimitedApplyStageConfig | null {
  return typeof stage === "string" && isLimitedApplyStage(stage) ? limitedApplyStageConfigs[stage] : null;
}

function isInsertOnly(value: unknown) {
  return Array.isArray(value) && value.length === 1 && value[0] === "insert";
}

function hasBlockedOperations(value: unknown) {
  if (!Array.isArray(value)) return false;
  const blocked = new Set(value);
  return ["update", "delete", "hard_delete", "full_apply"].every((operation) => blocked.has(operation));
}
