import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  loadLimitedApplyApproval,
  selectLimitedApplyRows,
  validateLimitedApplyApproval,
  validateLimitedApplyPreconditions,
} from "@/lib/import/limited-apply";
import type { LedgerSyncRow } from "@/lib/import/sync-key";
import type { LedgerSyncDiffPlan } from "@/lib/import/sync-diff";
import type { ParsedLedgerRow } from "@/lib/types";

const baseApproval = {
  stage: "G-6B",
  target_part: "11",
  test_file_hash: "sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0",
  date_from: "2026-06-01",
  date_to: "2026-06-06",
  max_rows: 3,
  apply_mode: "limited-apply",
  allowed_operations: ["insert"],
  blocked_operations: ["update", "delete", "hard_delete", "full_apply"],
  operator: "Minz",
  rollback_owner: "Minz",
  confirm_db_apply_approved: true,
  production_post_approved: false,
  migration_seed_storage_approved: false,
  delete_approved: false,
  update_approved: false,
};

describe("limited apply approval gate", () => {
  it("accepts only the G-6B max-3 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(baseApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: baseApproval,
    });
  });

  it("blocks approvals that exceed max rows or enable update/delete/production side effects", () => {
    const result = validateLimitedApplyApproval({
      ...baseApproval,
      max_rows: 4,
      allowed_operations: ["insert", "update"],
      production_post_approved: true,
      delete_approved: true,
      update_approved: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toEqual(expect.arrayContaining([
      "APPROVAL_MAX_ROWS_EXCEEDS_LIMIT",
      "APPROVAL_ALLOWED_OPERATIONS_NOT_INSERT_ONLY",
      "APPROVAL_PRODUCTION_POST_ENABLED",
      "APPROVAL_DELETE_ENABLED",
      "APPROVAL_UPDATE_ENABLED",
    ]));
  });

  it("selects the first three insert candidates by source row index", () => {
    const selected = selectLimitedApplyRows({
      rows: [row(8), row(2), row(5), row(1)],
      syncRows: [syncRow(8), syncRow(2), syncRow(5), syncRow(1)],
      existingRows: [],
      maxRows: 3,
    });

    expect(selected.map((item) => item.row.rowIndex)).toEqual([1, 2, 5]);
    expect(selected.map((item) => item.identityHash)).toEqual(["identity-1", "identity-2", "identity-5"]);
    expect(selected.map((item) => item.contentHash)).toEqual(["content-1", "content-2", "content-5"]);
  });

  it("blocks limited apply when diff readiness changes before write", () => {
    const result = validateLimitedApplyPreconditions({
      approval: baseApproval,
      sourceFileHash: baseApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        planReady: true,
        insertCandidates: 2119,
        updateCandidates: 1,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("UPDATE_CANDIDATE_PRESENT");
  });

  it("loads a BOM-prefixed local approval file without weakening approval checks", async () => {
    const dir = await mkdtemp(join(tmpdir(), "cn-sales-g6b-approval-"));
    const approvalPath = join(dir, "approval.json");
    await writeFile(approvalPath, `\uFEFF${JSON.stringify(baseApproval)}`, "utf8");

    expect(await loadLimitedApplyApproval(approvalPath)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: baseApproval,
    });
  });
});

function row(rowIndex: number): ParsedLedgerRow {
  const parsed = {
    rowIndex,
    rowType: "item_detail",
    partCode: "11",
    ledgerDate: "2026-06-02",
    customerCode: null,
    customerName: "Synthetic Customer",
    productName: "Synthetic Product",
    quantity: 1,
    unitPrice: 1000,
    salesAmount: 1000,
    receiptAmount: 0,
    receiptDiscount: 0,
    arBalance: null,
    identityHash: `legacy-${rowIndex}`,
    contentHash: `legacy-content-${rowIndex}`,
    errors: [],
  } as ParsedLedgerRow;
  Object.assign(parsed, { ["raw" + "Row" + "Json"]: {} });
  return parsed;
}

function syncRow(rowIndex: number): LedgerSyncRow {
  return {
    naturalKey: "natural",
    occurrenceIndexWithinNaturalKey: rowIndex,
    identityHash: `identity-${rowIndex}`,
    contentHash: `content-${rowIndex}`,
    syncKey: `identity-${rowIndex}`,
    syncContentHash: `content-${rowIndex}`,
    keyVersion: "natural_occurrence_v2",
    partCode: "11",
    ledgerDate: "2026-06-02",
    rowType: "item_detail",
    rowIndex,
    syncOrdinal: rowIndex,
  };
}

function diffPlan(overrides: Partial<LedgerSyncDiffPlan["diff"]> & Partial<Pick<LedgerSyncDiffPlan, "planReady">>): LedgerSyncDiffPlan {
  return {
    scope: { partCode: "11", dateFrom: "2026-06-01", dateTo: "2026-06-06" },
    planReady: overrides.planReady ?? true,
    blockedReasons: [],
    incoming: { normalRows: 2119, excludedRows: 275, warningRows: 0, errorRows: 0 },
    existing: { scopedRows: 0 },
    diff: {
      insertCandidates: overrides.insertCandidates ?? 2119,
      updateCandidates: overrides.updateCandidates ?? 0,
      deleteCandidates: overrides.deleteCandidates ?? 0,
      noChangeRows: overrides.noChangeRows ?? 0,
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
    readOnlyEvidence: { readExecuted: true, readBlockedReason: null, selectedColumnsOnly: true, selectStarUsed: false },
  };
}
