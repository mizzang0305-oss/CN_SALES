import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LedgerSyncDiffPlan } from "@/lib/import/sync-diff";
import type { LedgerSyncRow } from "@/lib/import/sync-key";
import type { ParsedLedgerRow } from "@/lib/types";

export const G6B_EXPECTED_SOURCE_FILE_HASH =
  "sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0";

export interface LimitedApplyApproval {
  stage: "G-6B";
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
  approvalPath = join(process.cwd(), ".local-approval", "g6b_limited_apply_approval.json"),
): Promise<LimitedApplyApprovalValidation> {
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

  if (approval.stage !== "G-6B") blockedReasons.push("APPROVAL_STAGE_MISMATCH");
  if (targetPart !== "11") blockedReasons.push("APPROVAL_TARGET_PART_MISMATCH");
  if (approval.test_file_hash !== G6B_EXPECTED_SOURCE_FILE_HASH) blockedReasons.push("APPROVAL_FILE_HASH_MISMATCH");
  if (approval.date_from !== "2026-06-01" || approval.date_to !== "2026-06-06") {
    blockedReasons.push("APPROVAL_DATE_RANGE_MISMATCH");
  }
  if (approval.max_rows !== 3) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
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
    .sort((left, right) => left.row.rowIndex - right.row.rowIndex)
    .slice(0, Math.max(0, Math.min(input.maxRows, 3)))
    .map((item) => ({
      row: item.row,
      syncRow: item.syncRow,
      identityHash: item.syncRow.syncKey,
      contentHash: item.syncRow.syncContentHash,
    }));
}

export function validateLimitedApplyPreconditions(input: {
  approval: LimitedApplyApproval;
  sourceFileHash: string;
  selectedPartCode: string;
  syncDiff: LedgerSyncDiffPlan;
}): { ok: boolean; blockedReasons: string[] } {
  const approvalValidation = validateLimitedApplyApproval(input.approval);
  const blockedReasons = [...approvalValidation.blockedReasons];
  const targetPart = String(input.approval.target_part).trim();

  if (input.sourceFileHash !== input.approval.test_file_hash) blockedReasons.push("SOURCE_FILE_HASH_MISMATCH");
  if (input.selectedPartCode !== targetPart) blockedReasons.push("TARGET_PART_MISMATCH");
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
  if (input.syncDiff.existing.scopedRows > 0) blockedReasons.push("EXISTING_SCOPED_ROWS_PRESENT");
  if (input.syncDiff.diff.updateCandidates > 0) blockedReasons.push("UPDATE_CANDIDATE_PRESENT");
  if (input.syncDiff.diff.deleteCandidates > 0) blockedReasons.push("DELETE_CANDIDATE_PRESENT");
  if (input.syncDiff.diff.noChangeRows > 0) blockedReasons.push("NO_CHANGE_ROWS_PRESENT");
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

function isInsertOnly(value: unknown) {
  return Array.isArray(value) && value.length === 1 && value[0] === "insert";
}

function hasBlockedOperations(value: unknown) {
  if (!Array.isArray(value)) return false;
  const blocked = new Set(value);
  return ["update", "delete", "hard_delete", "full_apply"].every((operation) => blocked.has(operation));
}
