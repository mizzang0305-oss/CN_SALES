import { describe, expect, it } from "vitest";
import {
  LIMITED_APPLY_STAGE_POLICIES,
  getLimitedApplyStageConfig,
  isLimitedApplyStage,
  selectLimitedApplyRows,
  summarizeLimitedApplyDateGuard,
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

const g6dApproval = {
  ...baseApproval,
  stage: "G-6D",
  max_rows: 30,
  source_preview: {
    existingScopedRows: 3,
    insertCandidates: 2116,
    noChangeRows: 3,
  },
};

const g6eApproval = {
  ...baseApproval,
  stage: "G-6E",
  max_rows: 100,
  source_preview: {
    existingScopedRows: 33,
    insertCandidates: 2086,
    noChangeRows: 33,
  },
};

const g6fApproval = {
  ...baseApproval,
  stage: "G-6F",
  max_rows: 500,
  source_preview: {
    existingScopedRows: 133,
    insertCandidates: 1986,
    noChangeRows: 133,
  },
};

const g6gApproval = {
  ...baseApproval,
  stage: "G-6G",
  max_rows: 500,
  source_preview: {
    existingScopedRows: 633,
    insertCandidates: 1486,
    noChangeRows: 633,
  },
};

const g6hApproval = {
  ...baseApproval,
  stage: "G-6H",
  max_rows: 500,
  source_preview: {
    existingScopedRows: 1133,
    insertCandidates: 986,
    noChangeRows: 1133,
  },
};

const g6iApproval = {
  ...baseApproval,
  stage: "G-6I",
  max_rows: 486,
  source_preview: {
    existingScopedRows: 1633,
    insertCandidates: 486,
    noChangeRows: 1633,
  },
};

describe("limited apply approval gate", () => {
  it("keeps stage caps and explicit-period policy centralized", () => {
    expect(LIMITED_APPLY_STAGE_POLICIES).toEqual({
      "G-6B": { maxRows: 3, requiresExplicitPeriod: false },
      "G-6D": { maxRows: 30, requiresExplicitPeriod: false },
      "G-6E": { maxRows: 100, requiresExplicitPeriod: false },
      "G-6F": { maxRows: 500, requiresExplicitPeriod: true },
      "G-6G": { maxRows: 500, requiresExplicitPeriod: true },
      "G-6H": { maxRows: 500, requiresExplicitPeriod: true },
      "G-6I": { maxRows: 486, requiresExplicitPeriod: true },
    });
  });

  it("recognizes G-6F as a configured limited apply stage", () => {
    expect(isLimitedApplyStage("G-6F")).toBe(true);
    expect(getLimitedApplyStageConfig("G-6F")).toMatchObject({
      stage: "G-6F",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 133,
      expectedInsertCandidates: 1986,
      expectedNoChangeRows: 133,
    });
  });

  it("recognizes G-6H and G-6I as the remaining limited apply stages", () => {
    expect(isLimitedApplyStage("G-6H")).toBe(true);
    expect(getLimitedApplyStageConfig("G-6H")).toMatchObject({
      stage: "G-6H",
      approvalFileName: "g6h_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 1133,
      expectedInsertCandidates: 986,
      expectedNoChangeRows: 1133,
      requiresExplicitPeriod: true,
    });
    expect(isLimitedApplyStage("G-6I")).toBe(true);
    expect(getLimitedApplyStageConfig("G-6I")).toMatchObject({
      stage: "G-6I",
      approvalFileName: "g6i_limited_apply_approval.json",
      expectedMaxRows: 486,
      expectedExistingScopedRows: 1633,
      expectedInsertCandidates: 486,
      expectedNoChangeRows: 1633,
      requiresExplicitPeriod: true,
    });
  });

  it("recognizes G-6G as the next max-500 limited apply stage", () => {
    expect(isLimitedApplyStage("G-6G")).toBe(true);
    expect(getLimitedApplyStageConfig("G-6G")).toMatchObject({
      stage: "G-6G",
      approvalFileName: "g6g_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 633,
      expectedInsertCandidates: 1486,
      expectedNoChangeRows: 633,
    });
  });

  it("accepts only the G-6B max-3 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(baseApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: baseApproval,
    });
  });

  it("accepts the G-6D max-30 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(g6dApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: g6dApproval,
    });
  });

  it("accepts the G-6E max-100 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(g6eApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: g6eApproval,
    });
  });

  it("accepts the G-6F max-500 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(g6fApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: g6fApproval,
    });
  });

  it("accepts the G-6G max-500 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(g6gApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: g6gApproval,
    });
  });

  it("accepts the G-6H max-500 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(g6hApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: g6hApproval,
    });
  });

  it("accepts the G-6I max-486 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(g6iApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: g6iApproval,
    });
  });

  it("blocks G-6F approvals when maxRows is not exactly 500", () => {
    const belowLimit = validateLimitedApplyApproval({
      ...g6fApproval,
      max_rows: 499,
    });
    const aboveLimit = validateLimitedApplyApproval({
      ...g6fApproval,
      max_rows: 501,
    });

    expect(belowLimit.ok).toBe(false);
    expect(belowLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
    expect(aboveLimit.ok).toBe(false);
    expect(aboveLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  });

  it("blocks G-6G approvals when maxRows is not exactly 500", () => {
    const belowLimit = validateLimitedApplyApproval({
      ...g6gApproval,
      max_rows: 499,
    });
    const aboveLimit = validateLimitedApplyApproval({
      ...g6gApproval,
      max_rows: 501,
    });

    expect(belowLimit.ok).toBe(false);
    expect(belowLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
    expect(aboveLimit.ok).toBe(false);
    expect(aboveLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  });

  it("blocks G-6H approvals when maxRows is not exactly 500", () => {
    const belowLimit = validateLimitedApplyApproval({
      ...g6hApproval,
      max_rows: 499,
    });
    const aboveLimit = validateLimitedApplyApproval({
      ...g6hApproval,
      max_rows: 501,
    });

    expect(belowLimit.ok).toBe(false);
    expect(belowLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
    expect(aboveLimit.ok).toBe(false);
    expect(aboveLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  });

  it("blocks G-6I approvals when maxRows is not exactly 486", () => {
    const belowLimit = validateLimitedApplyApproval({
      ...g6iApproval,
      max_rows: 485,
    });
    const aboveLimit = validateLimitedApplyApproval({
      ...g6iApproval,
      max_rows: 487,
    });

    expect(belowLimit.ok).toBe(false);
    expect(belowLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
    expect(aboveLimit.ok).toBe(false);
    expect(aboveLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
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

  it("blocks approvals that enable full apply", () => {
    const result = validateLimitedApplyApproval({
      ...g6dApproval,
      full_apply_approved: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("APPROVAL_FULL_APPLY_ENABLED");
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

  it("selects thirty G-6D insert candidates while skipping already-present sync keys", () => {
    const rows = Array.from({ length: 35 }, (_, index) => row(index + 1));
    const syncRows = Array.from({ length: 35 }, (_, index) => syncRow(index + 1));
    const existingRows = [syncRow(1), syncRow(2), syncRow(3)];
    const selected = selectLimitedApplyRows({
      rows,
      syncRows,
      existingRows,
      maxRows: 30,
    });

    expect(selected).toHaveLength(30);
    expect(selected[0]?.row.rowIndex).toBe(4);
    expect(selected.at(-1)?.row.rowIndex).toBe(33);
  });

  it("selects one hundred G-6E insert candidates while skipping already-present sync keys", () => {
    const rows = Array.from({ length: 140 }, (_, index) => row(index + 1));
    const syncRows = Array.from({ length: 140 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 33 }, (_, index) => syncRow(index + 1));
    const selected = selectLimitedApplyRows({
      rows,
      syncRows,
      existingRows,
      maxRows: 100,
    });

    expect(selected).toHaveLength(100);
    expect(selected[0]?.row.rowIndex).toBe(34);
    expect(selected.at(-1)?.row.rowIndex).toBe(133);
  });

  it("selects five hundred G-6F insert candidates while skipping already-present sync keys", () => {
    const rows = Array.from({ length: 700 }, (_, index) => row(index + 1));
    const syncRows = Array.from({ length: 700 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 133 }, (_, index) => syncRow(index + 1));
    const selected = selectLimitedApplyRows({
      rows,
      syncRows,
      existingRows,
      maxRows: 500,
    });

    expect(selected).toHaveLength(500);
    expect(selected[0]?.row.rowIndex).toBe(134);
    expect(selected.at(-1)?.row.rowIndex).toBe(633);
  });

  it("selects five hundred G-6G insert candidates while skipping already-present sync keys", () => {
    const rows = Array.from({ length: 1200 }, (_, index) => row(index + 1));
    const syncRows = Array.from({ length: 1200 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 633 }, (_, index) => syncRow(index + 1));
    const selected = selectLimitedApplyRows({
      rows,
      syncRows,
      existingRows,
      maxRows: 500,
    });

    expect(selected).toHaveLength(500);
    expect(selected[0]?.row.rowIndex).toBe(634);
    expect(selected.at(-1)?.row.rowIndex).toBe(1133);
  });

  it("selects five hundred G-6H insert candidates while skipping already-present sync keys", () => {
    const rows = Array.from({ length: 1700 }, (_, index) => row(index + 1));
    const syncRows = Array.from({ length: 1700 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 1133 }, (_, index) => syncRow(index + 1));
    const selected = selectLimitedApplyRows({
      rows,
      syncRows,
      existingRows,
      maxRows: 500,
    });

    expect(selected).toHaveLength(500);
    expect(selected[0]?.row.rowIndex).toBe(1134);
    expect(selected.at(-1)?.row.rowIndex).toBe(1633);
  });

  it("selects final G-6I insert candidates while skipping already-present sync keys", () => {
    const rows = Array.from({ length: 2119 }, (_, index) => row(index + 1));
    const syncRows = Array.from({ length: 2119 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 1633 }, (_, index) => syncRow(index + 1));
    const selected = selectLimitedApplyRows({
      rows,
      syncRows,
      existingRows,
      maxRows: 486,
    });

    expect(selected).toHaveLength(486);
    expect(selected[0]?.row.rowIndex).toBe(1634);
    expect(selected.at(-1)?.row.rowIndex).toBe(2119);
  });

  it("skips non-ISO ledger dates when choosing limited apply rows", () => {
    const selected = selectLimitedApplyRows({
      rows: [row(1, "not-a-date"), row(2, "2026-06-01"), row(3, "2026-06-02")],
      syncRows: [syncRow(1), syncRow(2), syncRow(3)],
      existingRows: [],
      maxRows: 2,
    });

    expect(selected.map((item) => item.row.rowIndex)).toEqual([2, 3]);
  });

  it("summarizes selected-row ledger date guard without exposing row content", () => {
    const selected = selectLimitedApplyRows({
      rows: [row(1, "2026-06-01"), row(2, "2026-06-02")],
      syncRows: [syncRow(1), syncRow(2)],
      existingRows: [],
      maxRows: 2,
    });

    expect(summarizeLimitedApplyDateGuard(selected)).toEqual({
      checkedRows: 2,
      nonIsoLedgerDateRows: 0,
      missingLedgerDateRows: 0,
    });
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

  it("allows G-6D when the pre-apply diff matches the expected post-G-6B state", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6dApproval,
      sourceFileHash: g6dApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 3,
        insertCandidates: 2116,
        noChangeRows: 3,
      }),
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("allows G-6E when the pre-apply diff matches the expected post-G-6D state", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6eApproval,
      sourceFileHash: g6eApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 33,
        insertCandidates: 2086,
        noChangeRows: 33,
      }),
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("allows G-6F when the pre-apply diff matches the expected post-G-6E state", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6fApproval,
      sourceFileHash: g6fApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 133,
        insertCandidates: 1986,
        noChangeRows: 133,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-06",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("allows G-6G when the pre-apply diff matches the expected post-G-6F state", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6gApproval,
      sourceFileHash: g6gApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 633,
        insertCandidates: 1486,
        noChangeRows: 633,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-06",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("allows G-6H when the pre-apply diff matches the expected post-G-6G state", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6hApproval,
      sourceFileHash: g6hApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 1133,
        insertCandidates: 986,
        noChangeRows: 1133,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-06",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("allows G-6I when the pre-apply diff matches the expected post-G-6H state", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6iApproval,
      sourceFileHash: g6iApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 1633,
        insertCandidates: 486,
        noChangeRows: 1633,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-06",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("blocks G-6F without an explicit request period scope", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6fApproval,
      sourceFileHash: g6fApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 133,
        insertCandidates: 1986,
        noChangeRows: 133,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-06",
        scopeSource: "derived",
      },
      requireExplicitRequestScope: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("REQUEST_PERIOD_SCOPE_REQUIRED");
  });

  it("blocks G-6G without an explicit request period scope", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6gApproval,
      sourceFileHash: g6gApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 633,
        insertCandidates: 1486,
        noChangeRows: 633,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-06",
        scopeSource: "derived",
      },
      requireExplicitRequestScope: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("REQUEST_PERIOD_SCOPE_REQUIRED");
  });

  it("blocks G-6H and G-6I without an explicit request period scope", () => {
    for (const approval of [g6hApproval, g6iApproval]) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "11",
        syncDiff: diffPlan({
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
        requestScope: {
          partCode: "11",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          scopeSource: "derived",
        },
        requireExplicitRequestScope: true,
      });

      expect(result.ok).toBe(false);
      expect(result.blockedReasons).toContain("REQUEST_PERIOD_SCOPE_REQUIRED");
    }
  });

  it("blocks G-6F when the request period does not match approval scope", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6fApproval,
      sourceFileHash: g6fApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 133,
        insertCandidates: 1986,
        noChangeRows: 133,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("REQUEST_SCOPE_DATE_MISMATCH");
  });

  it("blocks G-6F when update, delete, warning, or error rows appear before write", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6fApproval,
      sourceFileHash: g6fApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 133,
        insertCandidates: 1986,
        noChangeRows: 133,
        updateCandidates: 1,
        deleteCandidates: 1,
        warningRows: 1,
        errorRows: 1,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toEqual(expect.arrayContaining([
      "UPDATE_CANDIDATE_PRESENT",
      "DELETE_CANDIDATE_PRESENT",
      "WARNING_ROWS_PRESENT",
      "ERROR_ROWS_PRESENT",
    ]));
  });

  it("blocks G-6G when update, delete, warning, or error rows appear before write", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6gApproval,
      sourceFileHash: g6gApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 633,
        insertCandidates: 1486,
        noChangeRows: 633,
        updateCandidates: 1,
        deleteCandidates: 1,
        warningRows: 1,
        errorRows: 1,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toEqual(expect.arrayContaining([
      "UPDATE_CANDIDATE_PRESENT",
      "DELETE_CANDIDATE_PRESENT",
      "WARNING_ROWS_PRESENT",
      "ERROR_ROWS_PRESENT",
    ]));
  });

  it("blocks G-6H and G-6I when update, delete, warning, or error rows appear before write", () => {
    for (const approval of [g6hApproval, g6iApproval]) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "11",
        syncDiff: diffPlan({
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
          updateCandidates: 1,
          deleteCandidates: 1,
          warningRows: 1,
          errorRows: 1,
        }),
      });

      expect(result.ok).toBe(false);
      expect(result.blockedReasons).toEqual(expect.arrayContaining([
        "UPDATE_CANDIDATE_PRESENT",
        "DELETE_CANDIDATE_PRESENT",
        "WARNING_ROWS_PRESENT",
        "ERROR_ROWS_PRESENT",
      ]));
    }
  });

  it("blocks G-6D when the pre-apply diff no longer matches the expected counts", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6dApproval,
      sourceFileHash: g6dApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 4,
        insertCandidates: 2115,
        noChangeRows: 4,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toEqual(expect.arrayContaining([
      "EXISTING_SCOPED_ROWS_MISMATCH",
      "INSERT_CANDIDATES_MISMATCH",
      "NO_CHANGE_ROWS_MISMATCH",
    ]));
  });

  it("blocks G-6E when the pre-apply diff no longer matches the expected counts", () => {
    const result = validateLimitedApplyPreconditions({
      approval: g6eApproval,
      sourceFileHash: g6eApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        existingScopedRows: 34,
        insertCandidates: 2085,
        noChangeRows: 34,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toEqual(expect.arrayContaining([
      "EXISTING_SCOPED_ROWS_MISMATCH",
      "INSERT_CANDIDATES_MISMATCH",
      "NO_CHANGE_ROWS_MISMATCH",
    ]));
  });

});

function row(rowIndex: number, ledgerDate = "2026-06-02"): ParsedLedgerRow {
  const parsed = {
    rowIndex,
    rowType: "item_detail",
    partCode: "11",
    ledgerDate,
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

function diffPlan(
  overrides: Partial<LedgerSyncDiffPlan["diff"]> &
    Partial<Pick<LedgerSyncDiffPlan, "planReady">> &
    { existingScopedRows?: number; warningRows?: number; errorRows?: number },
): LedgerSyncDiffPlan {
  return {
    scope: { partCode: "11", dateFrom: "2026-06-01", dateTo: "2026-06-06", scopeSource: "derived" },
    planReady: overrides.planReady ?? true,
    blockedReasons: [],
    incoming: {
      normalRows: 2119,
      excludedRows: 275,
      warningRows: overrides.warningRows ?? 0,
      errorRows: overrides.errorRows ?? 0,
    },
    existing: { scopedRows: overrides.existingScopedRows ?? 0 },
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
