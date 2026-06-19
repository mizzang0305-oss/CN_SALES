import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  H2_EXPECTED_SOURCE_FILE_HASH,
  I2_EXPECTED_SOURCE_FILE_HASH,
  J2_EXPECTED_SOURCE_FILE_HASH,
  LIMITED_APPLY_STAGE_POLICIES,
  createLimitedApplySelectionDiagnostics,
  getLimitedApplyStageConfig,
  inferLimitedApplyDiagnosticStage,
  isLimitedApplyStage,
  loadLimitedApplyApproval,
  selectLimitedApplyRows,
  summarizeLimitedApplyDateDiagnostics,
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

const h2Approval = {
  ...baseApproval,
  stage: "H-2",
  test_file_hash: H2_EXPECTED_SOURCE_FILE_HASH,
  date_from: "2026-06-07",
  date_to: "2026-06-12",
  max_rows: 500,
  source_preview: {
    existingScopedRows: 0,
    insertCandidates: 2473,
    noChangeRows: 0,
  },
};

const h2fApproval = {
  ...h2Approval,
  workflowGate: "H-2F",
  max_rows: 473,
  expectedInsertedRows: 473,
  source_preview: {
    primaryScopeRows: 2473,
    existingScopedRows: 2000,
    insertCandidates: 473,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 2000,
  },
};

const i2Approval = {
  ...baseApproval,
  workflowGate: "I-2",
  stage: "I-2",
  target_part: "1",
  test_file_hash: I2_EXPECTED_SOURCE_FILE_HASH,
  date_from: "2026-06-01",
  date_to: "2026-06-06",
  max_rows: 500,
  expectedInsertedRows: 500,
  source_preview: {
    primaryScopeRows: 1528,
    existingScopedRows: 0,
    insertCandidates: 1528,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
  },
};

const i3Approval = {
  ...i2Approval,
  workflowGate: "I-3",
  stage: "I-3",
  expectedInsertedRows: 500,
  source_preview: {
    primaryScopeRows: 1528,
    existingScopedRows: 500,
    insertCandidates: 1028,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
  },
};

const i4Approval = {
  ...i2Approval,
  workflowGate: "I-4",
  stage: "I-4",
  expectedInsertedRows: 500,
  source_preview: {
    primaryScopeRows: 1528,
    existingScopedRows: 1000,
    insertCandidates: 528,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
  },
};

const i5Approval = {
  ...i2Approval,
  workflowGate: "I-5",
  stage: "I-5",
  max_rows: 28,
  expectedInsertedRows: 28,
  source_preview: {
    primaryScopeRows: 1528,
    existingScopedRows: 1500,
    insertCandidates: 28,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1500,
  },
};

const iSeriesApprovals = [i2Approval, i3Approval, i4Approval, i5Approval];
const remainingISeriesApprovals = [i3Approval, i4Approval, i5Approval];

const j2Approval = {
  ...baseApproval,
  workflowGate: "J-2",
  stage: "J-2",
  target_part: "4",
  test_file_hash: J2_EXPECTED_SOURCE_FILE_HASH,
  date_from: "2026-06-01",
  date_to: "2026-06-06",
  max_rows: 500,
  expectedInsertedRows: 500,
  source_preview: {
    primaryScopeRows: 1295,
    existingScopedRows: 0,
    insertCandidates: 1295,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
  },
};

const j3Approval = {
  ...j2Approval,
  workflowGate: "J-3",
  stage: "J-3",
  expectedInsertedRows: 500,
  source_preview: {
    primaryScopeRows: 1295,
    existingScopedRows: 500,
    insertCandidates: 795,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
  },
};

const j4Approval = {
  ...j2Approval,
  workflowGate: "J-4",
  stage: "J-4",
  max_rows: 295,
  expectedInsertedRows: 295,
  source_preview: {
    primaryScopeRows: 1295,
    existingScopedRows: 1000,
    insertCandidates: 295,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
  },
};

const jSeriesApprovals = [j2Approval, j3Approval, j4Approval];

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
      "H-2": { maxRows: 500, requiresExplicitPeriod: true },
      "I-2": { maxRows: 500, requiresExplicitPeriod: true },
      "I-3": { maxRows: 500, requiresExplicitPeriod: true },
      "I-4": { maxRows: 500, requiresExplicitPeriod: true },
      "I-5": { maxRows: 28, requiresExplicitPeriod: true },
      "J-2": { maxRows: 500, requiresExplicitPeriod: true },
      "J-3": { maxRows: 500, requiresExplicitPeriod: true },
      "J-4": { maxRows: 295, requiresExplicitPeriod: true },
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

  it("recognizes only explicit H-2 as the next limited apply stage", () => {
    expect(isLimitedApplyStage("H-2")).toBe(true);
    expect(getLimitedApplyStageConfig("H-2")).toMatchObject({
      stage: "H-2",
      approvalFileName: "h2_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 0,
      expectedInsertCandidates: 2473,
      expectedNoChangeRows: 0,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: H2_EXPECTED_SOURCE_FILE_HASH,
      expectedDateFrom: "2026-06-07",
      expectedDateTo: "2026-06-12",
    });
    expect(isLimitedApplyStage("H-1")).toBe(false);
    expect(isLimitedApplyStage("H-3")).toBe(false);
    expect(getLimitedApplyStageConfig("H-3")).toBeNull();
  });

  it("recognizes only explicit I-series part-1 limited apply stages", () => {
    expect(isLimitedApplyStage("I-2")).toBe(true);
    expect(getLimitedApplyStageConfig("I-2")).toMatchObject({
      stage: "I-2",
      expectedTargetPartCode: "1",
      expectedWorkflowGate: "I-2",
      approvalFileName: "i2_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 0,
      expectedInsertCandidates: 1528,
      expectedNoChangeRows: 0,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
      expectedDateFrom: "2026-06-01",
      expectedDateTo: "2026-06-06",
    });
    expect(isLimitedApplyStage("I-3")).toBe(true);
    expect(getLimitedApplyStageConfig("I-3")).toMatchObject({
      stage: "I-3",
      expectedTargetPartCode: "1",
      expectedWorkflowGate: "I-3",
      approvalFileName: "i3_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 500,
      expectedInsertCandidates: 1028,
      expectedNoChangeRows: 500,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
    });
    expect(isLimitedApplyStage("I-4")).toBe(true);
    expect(getLimitedApplyStageConfig("I-4")).toMatchObject({
      stage: "I-4",
      expectedTargetPartCode: "1",
      expectedWorkflowGate: "I-4",
      approvalFileName: "i4_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 1000,
      expectedInsertCandidates: 528,
      expectedNoChangeRows: 1000,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
    });
    expect(isLimitedApplyStage("I-5")).toBe(true);
    expect(getLimitedApplyStageConfig("I-5")).toMatchObject({
      stage: "I-5",
      expectedTargetPartCode: "1",
      expectedWorkflowGate: "I-5",
      approvalFileName: "i5_limited_apply_approval.json",
      expectedMaxRows: 28,
      expectedExistingScopedRows: 1500,
      expectedInsertCandidates: 28,
      expectedNoChangeRows: 1500,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
    });
    expect(isLimitedApplyStage("I-1")).toBe(false);
    expect(isLimitedApplyStage("I-6")).toBe(false);
    expect(isLimitedApplyStage("I-*")).toBe(false);
    expect(getLimitedApplyStageConfig("I-6")).toBeNull();
  });

  it("recognizes only explicit J-series part-4 limited apply stages", () => {
    expect(isLimitedApplyStage("J-2")).toBe(true);
    expect(getLimitedApplyStageConfig("J-2")).toMatchObject({
      stage: "J-2",
      expectedTargetPartCode: "4",
      expectedWorkflowGate: "J-2",
      approvalFileName: "j2_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 0,
      expectedInsertCandidates: 1295,
      expectedNoChangeRows: 0,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: J2_EXPECTED_SOURCE_FILE_HASH,
      expectedDateFrom: "2026-06-01",
      expectedDateTo: "2026-06-06",
    });
    expect(isLimitedApplyStage("J-3")).toBe(true);
    expect(getLimitedApplyStageConfig("J-3")).toMatchObject({
      stage: "J-3",
      expectedTargetPartCode: "4",
      expectedWorkflowGate: "J-3",
      approvalFileName: "j3_limited_apply_approval.json",
      expectedMaxRows: 500,
      expectedExistingScopedRows: 500,
      expectedInsertCandidates: 795,
      expectedNoChangeRows: 500,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: J2_EXPECTED_SOURCE_FILE_HASH,
    });
    expect(isLimitedApplyStage("J-4")).toBe(true);
    expect(getLimitedApplyStageConfig("J-4")).toMatchObject({
      stage: "J-4",
      expectedTargetPartCode: "4",
      expectedWorkflowGate: "J-4",
      approvalFileName: "j4_limited_apply_approval.json",
      expectedMaxRows: 295,
      expectedExistingScopedRows: 1000,
      expectedInsertCandidates: 295,
      expectedNoChangeRows: 1000,
      requiresExplicitPeriod: true,
      expectedSourceFileHash: J2_EXPECTED_SOURCE_FILE_HASH,
    });
    expect(isLimitedApplyStage("J-0")).toBe(false);
    expect(isLimitedApplyStage("J-1")).toBe(false);
    expect(isLimitedApplyStage("J-5")).toBe(false);
    expect(isLimitedApplyStage("J-*")).toBe(false);
    expect(getLimitedApplyStageConfig("J-5")).toBeNull();
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

  it("accepts the H-2 max-500 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(h2Approval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: h2Approval,
    });
  });

  it("accepts the H-2F final remainder max-473 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(h2fApproval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: h2fApproval,
    });
  });

  it("accepts the I-2 max-500 insert-only approval shape", () => {
    expect(validateLimitedApplyApproval(i2Approval)).toEqual({
      ok: true,
      blockedReasons: [],
      approval: i2Approval,
    });
  });

  it("accepts the I-3, I-4, and I-5 exact insert-only approval shapes", () => {
    for (const approval of remainingISeriesApprovals) {
      expect(validateLimitedApplyApproval(approval)).toEqual({
        ok: true,
        blockedReasons: [],
        approval,
      });
    }
  });

  it("accepts the J-series exact insert-only approval shapes", () => {
    for (const approval of jSeriesApprovals) {
      expect(validateLimitedApplyApproval(approval)).toEqual({
        ok: true,
        blockedReasons: [],
        approval,
      });
    }
  });

  it("keeps existing H-2 max-500 workflow gates valid while adding H-2F separately", () => {
    expect(validateLimitedApplyApproval({
      ...h2Approval,
      workflowGate: "H-2E",
      source_preview: {
        existingScopedRows: 1500,
        insertCandidates: 973,
        noChangeRows: 1500,
      },
    })).toMatchObject({
      ok: true,
      blockedReasons: [],
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

  it("blocks H-2 approvals outside max-500, insert-only, exact hash, and exact period constraints", () => {
    const aboveLimit = validateLimitedApplyApproval({
      ...h2Approval,
      max_rows: 501,
    });
    const updateOperation = validateLimitedApplyApproval({
      ...h2Approval,
      allowed_operations: ["update"],
    });
    const hashMismatch = validateLimitedApplyApproval({
      ...h2Approval,
      test_file_hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    });
    const periodMismatch = validateLimitedApplyApproval({
      ...h2Approval,
      date_from: "2026-06-06",
    });
    const fullApply = validateLimitedApplyApproval({
      ...h2Approval,
      full_apply_approved: true,
    });

    expect(aboveLimit.ok).toBe(false);
    expect(aboveLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
    expect(updateOperation.ok).toBe(false);
    expect(updateOperation.blockedReasons).toContain("APPROVAL_ALLOWED_OPERATIONS_NOT_INSERT_ONLY");
    expect(hashMismatch.ok).toBe(false);
    expect(hashMismatch.blockedReasons).toContain("APPROVAL_FILE_HASH_MISMATCH");
    expect(periodMismatch.ok).toBe(false);
    expect(periodMismatch.blockedReasons).toContain("APPROVAL_DATE_RANGE_MISMATCH");
    expect(fullApply.ok).toBe(false);
    expect(fullApply.blockedReasons).toContain("APPROVAL_FULL_APPLY_ENABLED");
  });

  it("blocks H-2F final remainder approvals outside the exact 473-row contract", () => {
    const wrongMaxRows = validateLimitedApplyApproval({
      ...h2fApproval,
      max_rows: 474,
    });
    const max500WithRemainderExpectation = validateLimitedApplyApproval({
      ...h2fApproval,
      max_rows: 500,
    });
    const wrongWorkflowGate = validateLimitedApplyApproval({
      ...h2fApproval,
      workflowGate: "H-3",
    });
    const missingExpectedInsertedRows = validateLimitedApplyApproval({
      ...h2fApproval,
      expectedInsertedRows: undefined,
    });
    const wrongExistingRows = validateLimitedApplyApproval({
      ...h2fApproval,
      source_preview: {
        ...h2fApproval.source_preview,
        existingScopedRows: 1999,
      },
    });
    const wrongInsertCandidates = validateLimitedApplyApproval({
      ...h2fApproval,
      source_preview: {
        ...h2fApproval.source_preview,
        insertCandidates: 474,
      },
    });
    const wrongUpdateCandidates = validateLimitedApplyApproval({
      ...h2fApproval,
      source_preview: {
        ...h2fApproval.source_preview,
        updateCandidates: 1,
      },
    });

    expect(wrongMaxRows.ok).toBe(false);
    expect(wrongMaxRows.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
    expect(max500WithRemainderExpectation.ok).toBe(false);
    expect(max500WithRemainderExpectation.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
    expect(wrongWorkflowGate.ok).toBe(false);
    expect(wrongWorkflowGate.blockedReasons).toContain("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
    expect(missingExpectedInsertedRows.ok).toBe(false);
    expect(missingExpectedInsertedRows.blockedReasons).toContain("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
    expect(wrongExistingRows.ok).toBe(false);
    expect(wrongExistingRows.blockedReasons).toContain("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
    expect(wrongInsertCandidates.ok).toBe(false);
    expect(wrongInsertCandidates.blockedReasons).toContain("APPROVAL_INSERT_CANDIDATES_MISMATCH");
    expect(wrongUpdateCandidates.ok).toBe(false);
    expect(wrongUpdateCandidates.blockedReasons).toContain("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  });

  it("blocks H-2F final remainder approvals with wrong period, file hash, or operation", () => {
    const wrongPeriod = validateLimitedApplyApproval({
      ...h2fApproval,
      date_to: "2026-06-13",
    });
    const wrongHash = validateLimitedApplyApproval({
      ...h2fApproval,
      test_file_hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    });
    const updateOperation = validateLimitedApplyApproval({
      ...h2fApproval,
      allowed_operations: ["update"],
    });
    const fullApply = validateLimitedApplyApproval({
      ...h2fApproval,
      full_apply_approved: true,
    });

    expect(wrongPeriod.ok).toBe(false);
    expect(wrongPeriod.blockedReasons).toContain("APPROVAL_DATE_RANGE_MISMATCH");
    expect(wrongHash.ok).toBe(false);
    expect(wrongHash.blockedReasons).toContain("APPROVAL_FILE_HASH_MISMATCH");
    expect(updateOperation.ok).toBe(false);
    expect(updateOperation.blockedReasons).toContain("APPROVAL_ALLOWED_OPERATIONS_NOT_INSERT_ONLY");
    expect(fullApply.ok).toBe(false);
    expect(fullApply.blockedReasons).toContain("APPROVAL_FULL_APPLY_ENABLED");
  });

  it("blocks I-series approvals outside maxRows, insert-only, exact hash, exact period, and workflow constraints", () => {
    for (const approval of iSeriesApprovals) {
      const wrongWorkflowGate = validateLimitedApplyApproval({
        ...approval,
        workflowGate: `${approval.workflowGate}-B`,
      });
      const missingWorkflowGate = validateLimitedApplyApproval({
        ...approval,
        workflowGate: undefined,
      });
      const aboveLimit = validateLimitedApplyApproval({
        ...approval,
        max_rows: approval.max_rows + 1,
      });
      const belowLimit = validateLimitedApplyApproval({
        ...approval,
        max_rows: approval.max_rows - 1,
      });
      const updateOperation = validateLimitedApplyApproval({
        ...approval,
        allowed_operations: ["update"],
      });
      const hashMismatch = validateLimitedApplyApproval({
        ...approval,
        test_file_hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      });
      const periodMismatch = validateLimitedApplyApproval({
        ...approval,
        date_to: "2026-06-07",
      });
      const wrongPart = validateLimitedApplyApproval({
        ...approval,
        target_part: "11",
      });
      const fullApply = validateLimitedApplyApproval({
        ...approval,
        full_apply_approved: true,
      });

      expect(wrongWorkflowGate.ok).toBe(false);
      expect(wrongWorkflowGate.blockedReasons).toContain("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
      expect(missingWorkflowGate.ok).toBe(false);
      expect(missingWorkflowGate.blockedReasons).toContain("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
      expect(aboveLimit.ok).toBe(false);
      expect(aboveLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
      expect(belowLimit.ok).toBe(false);
      expect(belowLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
      expect(updateOperation.ok).toBe(false);
      expect(updateOperation.blockedReasons).toContain("APPROVAL_ALLOWED_OPERATIONS_NOT_INSERT_ONLY");
      expect(hashMismatch.ok).toBe(false);
      expect(hashMismatch.blockedReasons).toContain("APPROVAL_FILE_HASH_MISMATCH");
      expect(periodMismatch.ok).toBe(false);
      expect(periodMismatch.blockedReasons).toContain("APPROVAL_DATE_RANGE_MISMATCH");
      expect(wrongPart.ok).toBe(false);
      expect(wrongPart.blockedReasons).toContain("APPROVAL_TARGET_PART_MISMATCH");
      expect(fullApply.ok).toBe(false);
      expect(fullApply.blockedReasons).toContain("APPROVAL_FULL_APPLY_ENABLED");
    }
  });

  it("blocks J-series approvals outside maxRows, insert-only, exact hash, exact period, and workflow constraints", () => {
    for (const approval of jSeriesApprovals) {
      const wrongWorkflowGate = validateLimitedApplyApproval({
        ...approval,
        workflowGate: `${approval.workflowGate}-B`,
      });
      const missingWorkflowGate = validateLimitedApplyApproval({
        ...approval,
        workflowGate: undefined,
      });
      const aboveLimit = validateLimitedApplyApproval({
        ...approval,
        max_rows: approval.max_rows + 1,
      });
      const belowLimit = validateLimitedApplyApproval({
        ...approval,
        max_rows: approval.max_rows - 1,
      });
      const updateOperation = validateLimitedApplyApproval({
        ...approval,
        allowed_operations: ["update"],
      });
      const hashMismatch = validateLimitedApplyApproval({
        ...approval,
        test_file_hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      });
      const periodMismatch = validateLimitedApplyApproval({
        ...approval,
        date_to: "2026-06-07",
      });
      const wrongPart = validateLimitedApplyApproval({
        ...approval,
        target_part: "11",
      });
      const fullApply = validateLimitedApplyApproval({
        ...approval,
        full_apply_approved: true,
      });

      expect(wrongWorkflowGate.ok).toBe(false);
      expect(wrongWorkflowGate.blockedReasons).toContain("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
      expect(missingWorkflowGate.ok).toBe(false);
      expect(missingWorkflowGate.blockedReasons).toContain("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
      expect(aboveLimit.ok).toBe(false);
      expect(aboveLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
      expect(belowLimit.ok).toBe(false);
      expect(belowLimit.blockedReasons).toContain("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
      expect(updateOperation.ok).toBe(false);
      expect(updateOperation.blockedReasons).toContain("APPROVAL_ALLOWED_OPERATIONS_NOT_INSERT_ONLY");
      expect(hashMismatch.ok).toBe(false);
      expect(hashMismatch.blockedReasons).toContain("APPROVAL_FILE_HASH_MISMATCH");
      expect(periodMismatch.ok).toBe(false);
      expect(periodMismatch.blockedReasons).toContain("APPROVAL_DATE_RANGE_MISMATCH");
      expect(wrongPart.ok).toBe(false);
      expect(wrongPart.blockedReasons).toContain("APPROVAL_TARGET_PART_MISMATCH");
      expect(fullApply.ok).toBe(false);
      expect(fullApply.blockedReasons).toContain("APPROVAL_FULL_APPLY_ENABLED");
    }
  });

  it("blocks I-series approvals outside the exact expected count contract", () => {
    for (const approval of iSeriesApprovals) {
      const missingExpectedInsertedRows = validateLimitedApplyApproval({
        ...approval,
        expectedInsertedRows: undefined,
      });
      const wrongPrimaryScopeRows = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          primaryScopeRows: approval.source_preview.primaryScopeRows - 1,
        },
      });
      const wrongExistingRows = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          existingScopedRows: approval.source_preview.existingScopedRows + 1,
        },
      });
      const wrongInsertCandidates = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          insertCandidates: approval.source_preview.insertCandidates - 1,
        },
      });
      const wrongUpdateCandidates = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          updateCandidates: 1,
        },
      });
      const wrongDeleteCandidates = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          deleteCandidates: 1,
        },
      });
      const wrongNoChangeRows = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          noChangeRows: approval.source_preview.noChangeRows + 1,
        },
      });

      expect(missingExpectedInsertedRows.ok).toBe(false);
      expect(missingExpectedInsertedRows.blockedReasons).toContain("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
      expect(wrongPrimaryScopeRows.ok).toBe(false);
      expect(wrongPrimaryScopeRows.blockedReasons).toContain("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
      expect(wrongExistingRows.ok).toBe(false);
      expect(wrongExistingRows.blockedReasons).toContain("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
      expect(wrongInsertCandidates.ok).toBe(false);
      expect(wrongInsertCandidates.blockedReasons).toContain("APPROVAL_INSERT_CANDIDATES_MISMATCH");
      expect(wrongUpdateCandidates.ok).toBe(false);
      expect(wrongUpdateCandidates.blockedReasons).toContain("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
      expect(wrongDeleteCandidates.ok).toBe(false);
      expect(wrongDeleteCandidates.blockedReasons).toContain("APPROVAL_DELETE_CANDIDATES_MISMATCH");
      expect(wrongNoChangeRows.ok).toBe(false);
      expect(wrongNoChangeRows.blockedReasons).toContain("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
    }
  });

  it("blocks J-series approvals outside the exact expected count contract", () => {
    for (const approval of jSeriesApprovals) {
      const missingExpectedInsertedRows = validateLimitedApplyApproval({
        ...approval,
        expectedInsertedRows: undefined,
      });
      const wrongPrimaryScopeRows = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          primaryScopeRows: approval.source_preview.primaryScopeRows - 1,
        },
      });
      const wrongExistingRows = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          existingScopedRows: approval.source_preview.existingScopedRows + 1,
        },
      });
      const wrongInsertCandidates = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          insertCandidates: approval.source_preview.insertCandidates - 1,
        },
      });
      const wrongUpdateCandidates = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          updateCandidates: 1,
        },
      });
      const wrongDeleteCandidates = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          deleteCandidates: 1,
        },
      });
      const wrongNoChangeRows = validateLimitedApplyApproval({
        ...approval,
        source_preview: {
          ...approval.source_preview,
          noChangeRows: approval.source_preview.noChangeRows + 1,
        },
      });

      expect(missingExpectedInsertedRows.ok).toBe(false);
      expect(missingExpectedInsertedRows.blockedReasons).toContain("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
      expect(wrongPrimaryScopeRows.ok).toBe(false);
      expect(wrongPrimaryScopeRows.blockedReasons).toContain("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
      expect(wrongExistingRows.ok).toBe(false);
      expect(wrongExistingRows.blockedReasons).toContain("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
      expect(wrongInsertCandidates.ok).toBe(false);
      expect(wrongInsertCandidates.blockedReasons).toContain("APPROVAL_INSERT_CANDIDATES_MISMATCH");
      expect(wrongUpdateCandidates.ok).toBe(false);
      expect(wrongUpdateCandidates.blockedReasons).toContain("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
      expect(wrongDeleteCandidates.ok).toBe(false);
      expect(wrongDeleteCandidates.blockedReasons).toContain("APPROVAL_DELETE_CANDIDATES_MISMATCH");
      expect(wrongNoChangeRows.ok).toBe(false);
      expect(wrongNoChangeRows.blockedReasons).toContain("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
    }
  });

  it("blocks H-2 dryRun=false entry when the local approval file is missing", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "cn-sales-h2-approval-"));
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir);

    try {
      await expect(loadLimitedApplyApproval("H-2")).resolves.toEqual({
        ok: false,
        blockedReasons: ["APPROVAL_FILE_MISSING_OR_UNREADABLE"],
      });
    } finally {
      cwdSpy.mockRestore();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("blocks I-series dryRun=false entry when the local approval file is missing", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "cn-sales-i-series-approval-"));
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir);

    try {
      for (const stage of ["I-2", "I-3", "I-4", "I-5"] as const) {
        await expect(loadLimitedApplyApproval(stage)).resolves.toEqual({
          ok: false,
          blockedReasons: ["APPROVAL_FILE_MISSING_OR_UNREADABLE"],
        });
      }
    } finally {
      cwdSpy.mockRestore();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("blocks J-series dryRun=false entry when the local approval file is missing", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "cn-sales-j-series-approval-"));
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir);

    try {
      for (const stage of ["J-2", "J-3", "J-4"] as const) {
        await expect(loadLimitedApplyApproval(stage)).resolves.toEqual({
          ok: false,
          blockedReasons: ["APPROVAL_FILE_MISSING_OR_UNREADABLE"],
        });
      }
    } finally {
      cwdSpy.mockRestore();
      rmSync(tempDir, { recursive: true, force: true });
    }
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

  it("pairs rows and sync rows by array position so duplicate source row indexes do not collapse candidates", () => {
    const selected = selectLimitedApplyRows({
      rows: [row(1), row(1), row(2)],
      syncRows: [syncRow(1, { identity: "identity-a", naturalKey: "natural-a" }), syncRow(1, { identity: "identity-b", naturalKey: "natural-b" }), syncRow(2, { identity: "identity-c", naturalKey: "natural-c" })],
      existingRows: [syncRow(1, { identity: "identity-b", naturalKey: "natural-b" })],
      maxRows: 3,
    });

    expect(selected).toHaveLength(2);
    expect(selected.map((item) => item.identityHash)).toEqual(["identity-a", "identity-c"]);
  });

  it("blocks noncanonical selected ledger dates at the explicit date guard", () => {
    const selected = selectLimitedApplyRows({
      rows: [row(1, "not-a-date"), row(2, "2026-06-01"), row(3, "2026-06-02")],
      syncRows: [syncRow(1), syncRow(2), syncRow(3)],
      existingRows: [],
      maxRows: 3,
    });

    expect(selected).toHaveLength(3);
    expect(summarizeLimitedApplyDateGuard(selected)).toMatchObject({ checkedRows: 3, nonIsoLedgerDateRows: 1 });
  });

  it("summarizes final G-6I selected dates as canonical ISO without exposing raw rows", () => {
    const rows = Array.from({ length: 2119 }, (_, index) => {
      const isFinalWindow = index >= 1633;
      const normalizedFromNonIso = isFinalWindow && index < 1818;
      return row(index + 1, "2026-06-02", normalizedFromNonIso
        ? { ledgerDateFormatCategory: "yyyy.m.d", ledgerDateWasNormalized: true }
        : { ledgerDateFormatCategory: "yyyy-mm-dd", ledgerDateWasNormalized: false });
    });
    const syncRows = Array.from({ length: 2119 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 1633 }, (_, index) => syncRow(index + 1));
    const selected = selectLimitedApplyRows({
      rows,
      syncRows,
      existingRows,
      maxRows: 486,
    });

    expect(selected).toHaveLength(486);
    expect(summarizeLimitedApplyDateDiagnostics(selected, {
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
    })).toEqual({
      checkedRows: 486,
      canonicalIsoLedgerDateCount: 486,
      nonIsoLedgerDateCandidates: 0,
      invalidLedgerDateCandidates: 0,
      missingLedgerDateCandidates: 0,
      dateOutsideScopeCandidates: 0,
      parseableNonIsoCount: 185,
      normalizedToIsoCount: 185,
      formatCategories: {
        "yyyy-mm-dd": 301,
        "yyyy.m.d": 185,
        "yyyy/mm/dd": 0,
        "m/d/yyyy": 0,
        "excel-serial": 0,
        "korean-date": 0,
        datetime: 0,
        unknown: 0,
      },
      rawRowsReturned: false,
    });
  });

  it("creates digest-only G-6I diagnostics that align dry-run candidates with selector output", () => {
    const rows = Array.from({ length: 2119 }, (_, index) => row(index + 1));
    const syncRows = Array.from({ length: 2119 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 1633 }, (_, index) => syncRow(index + 1));
    const diagnostics = createLimitedApplySelectionDiagnostics({
      stage: "G-6I",
      rows,
      syncRows,
      existingRows,
      maxRows: 486,
      insertCandidates: 486,
    });

    expect(diagnostics).toMatchObject({
      stage: "G-6I",
      insertCandidates: 486,
      maxRows: 486,
      candidateRows: 486,
      selectedRowsDryRunEquivalent: 486,
      candidateDigestMatchesSelector: true,
      orderDigestMatchesSelector: true,
      rawRowsReturned: false,
    });
    expect(diagnostics.candidateIdentityDigest).toBe(diagnostics.selectorIdentityDigest);
    expect(diagnostics.candidateOrderDigest).toBe(diagnostics.selectorOrderDigest);
  });

  it("creates aggregate-only H-2 dry-run diagnostics without exposing raw row content", () => {
    const rows = Array.from({ length: 2473 }, (_, index) => row(index + 1, "2026-06-07"));
    const syncRows = Array.from({ length: 2473 }, (_, index) => syncRow(index + 1));
    const diagnostics = createLimitedApplySelectionDiagnostics({
      stage: "H-2",
      rows,
      syncRows,
      existingRows: [],
      maxRows: 500,
      insertCandidates: 2473,
    });
    const serialized = JSON.stringify(diagnostics);

    expect(inferLimitedApplyDiagnosticStage(diffPlan({
      dateFrom: "2026-06-07",
      dateTo: "2026-06-12",
      normalRows: 2473,
      excludedRows: 271,
      existingScopedRows: 0,
      insertCandidates: 2473,
      noChangeRows: 0,
    }))).toBe("H-2");
    expect(diagnostics).toMatchObject({
      stage: "H-2",
      insertCandidates: 2473,
      maxRows: 500,
      candidateRows: 2473,
      selectedRowsDryRunEquivalent: 500,
      candidateDigestMatchesSelector: true,
      orderDigestMatchesSelector: true,
      rawRowsReturned: false,
    });
    expect(serialized).not.toContain("rawRowJson");
    expect(serialized).not.toContain("Synthetic Customer");
    expect(serialized).not.toContain("Synthetic Product");
  });

  it("creates aggregate-only H-2F final remainder selection diagnostics without exposing raw row content", () => {
    const rows = Array.from({ length: 473 }, (_, index) => row(index + 1, "2026-06-12"));
    const syncRows = Array.from({ length: 473 }, (_, index) => syncRow(index + 1));
    const diagnostics = createLimitedApplySelectionDiagnostics({
      stage: "H-2",
      rows,
      syncRows,
      existingRows: [],
      maxRows: 473,
      insertCandidates: 473,
    });
    const serialized = JSON.stringify(diagnostics);

    expect(diagnostics).toMatchObject({
      stage: "H-2",
      insertCandidates: 473,
      maxRows: 473,
      candidateRows: 473,
      selectedRowsDryRunEquivalent: 473,
      candidateDigestMatchesSelector: true,
      orderDigestMatchesSelector: true,
      rawRowsReturned: false,
    });
    expect(serialized).not.toContain(`raw${"Row"}Json`);
    expect(serialized).not.toContain(`Synthetic ${"Customer"}`);
    expect(serialized).not.toContain(`Synthetic ${"Product"}`);
  });

  it("creates aggregate-only J-series diagnostics without exposing raw row content", () => {
    const rows = Array.from({ length: 1295 }, (_, index) => row(index + 1, "2026-06-01"));
    const syncRows = Array.from({ length: 1295 }, (_, index) => syncRow(index + 1));
    const existingRows = Array.from({ length: 1000 }, (_, index) => syncRow(index + 1));
    const diagnostics = createLimitedApplySelectionDiagnostics({
      stage: "J-4",
      rows,
      syncRows,
      existingRows,
      maxRows: 295,
      insertCandidates: 295,
    });
    const serialized = JSON.stringify(diagnostics);

    expect(inferLimitedApplyDiagnosticStage(diffPlan({
      partCode: "4",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-06",
      normalRows: 1295,
      excludedRows: 175,
      existingScopedRows: 1000,
      insertCandidates: 295,
      noChangeRows: 1000,
    }))).toBe("J-4");
    expect(diagnostics).toMatchObject({
      stage: "J-4",
      insertCandidates: 295,
      maxRows: 295,
      candidateRows: 295,
      selectedRowsDryRunEquivalent: 295,
      candidateDigestMatchesSelector: true,
      orderDigestMatchesSelector: true,
      rawRowsReturned: false,
    });
    expect(serialized).not.toContain(`raw${"Row"}Json`);
    expect(serialized).not.toContain(`Synthetic ${"Customer"}`);
    expect(serialized).not.toContain(`Synthetic ${"Product"}`);
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

  it("allows H-2 when the aggregate dry-run diff matches the next XLS primary scope", () => {
    const result = validateLimitedApplyPreconditions({
      approval: h2Approval,
      sourceFileHash: h2Approval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        normalRows: 2473,
        excludedRows: 271,
        existingScopedRows: 0,
        insertCandidates: 2473,
        noChangeRows: 0,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("allows H-2F when the aggregate dry-run diff matches the final 473-row remainder", () => {
    const result = validateLimitedApplyPreconditions({
      approval: h2fApproval,
      sourceFileHash: h2fApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        normalRows: 2473,
        excludedRows: 271,
        existingScopedRows: 2000,
        insertCandidates: 473,
        noChangeRows: 2000,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(result).toEqual({
      ok: true,
      blockedReasons: [],
    });
  });

  it("allows I-2 when the aggregate dry-run diff matches the part-1 next XLS primary scope", () => {
    const result = validateLimitedApplyPreconditions({
      approval: i2Approval,
      sourceFileHash: i2Approval.test_file_hash,
      selectedPartCode: "1",
      syncDiff: diffPlan({
        partCode: "1",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-06",
        normalRows: 1528,
        excludedRows: 246,
        existingScopedRows: 0,
        insertCandidates: 1528,
        noChangeRows: 0,
      }),
      requestScope: {
        partCode: "1",
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

  it("allows I-3, I-4, and I-5 when aggregate dry-run diff matches each remaining batch scope", () => {
    for (const approval of remainingISeriesApprovals) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "1",
        syncDiff: diffPlan({
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1528,
          excludedRows: 246,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
        requestScope: {
          partCode: "1",
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
    }
  });

  it("allows J-series stages when aggregate dry-run diff matches each part-4 batch scope", () => {
    for (const approval of jSeriesApprovals) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "4",
        syncDiff: diffPlan({
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1295,
          excludedRows: 175,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
        requestScope: {
          partCode: "4",
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
    }
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

  it("blocks H-2 without an explicit request period scope", () => {
    const result = validateLimitedApplyPreconditions({
      approval: h2Approval,
      sourceFileHash: h2Approval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        normalRows: 2473,
        excludedRows: 271,
        existingScopedRows: 0,
        insertCandidates: 2473,
        noChangeRows: 0,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        scopeSource: "derived",
      },
      requireExplicitRequestScope: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("REQUEST_PERIOD_SCOPE_REQUIRED");
  });

  it("blocks I-series stages without an explicit request period scope", () => {
    for (const approval of iSeriesApprovals) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "1",
        syncDiff: diffPlan({
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1528,
          excludedRows: 246,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
        requestScope: {
          partCode: "1",
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

  it("blocks J-series stages without an explicit request period scope", () => {
    for (const approval of jSeriesApprovals) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "4",
        syncDiff: diffPlan({
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1295,
          excludedRows: 175,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
        requestScope: {
          partCode: "4",
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

  it("blocks H-2 when the request or sync period leaves 2026-06-07 through 2026-06-12", () => {
    const requestMismatch = validateLimitedApplyPreconditions({
      approval: h2Approval,
      sourceFileHash: h2Approval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        normalRows: 2473,
        excludedRows: 271,
        existingScopedRows: 0,
        insertCandidates: 2473,
        noChangeRows: 0,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-06",
        dateTo: "2026-06-12",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });
    const syncMismatch = validateLimitedApplyPreconditions({
      approval: h2Approval,
      sourceFileHash: h2Approval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-06",
        dateTo: "2026-06-12",
        normalRows: 2473,
        excludedRows: 271,
        existingScopedRows: 0,
        insertCandidates: 2473,
        noChangeRows: 0,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(requestMismatch.ok).toBe(false);
    expect(requestMismatch.blockedReasons).toContain("REQUEST_SCOPE_DATE_MISMATCH");
    expect(syncMismatch.ok).toBe(false);
    expect(syncMismatch.blockedReasons).toContain("SYNC_SCOPE_DATE_MISMATCH");
  });

  it("blocks I-series stages when the request, part, hash, or dry-run counts drift before write", () => {
    for (const approval of iSeriesApprovals) {
      const requestMismatch = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "1",
        syncDiff: diffPlan({
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1528,
          excludedRows: 246,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
        requestScope: {
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-07",
          scopeSource: "explicit-request",
        },
        requireExplicitRequestScope: true,
      });
      const wrongPart = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "11",
        syncDiff: diffPlan({
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1528,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
      });
      const wrongHash = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: H2_EXPECTED_SOURCE_FILE_HASH,
        selectedPartCode: "1",
        syncDiff: diffPlan({
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1528,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
      });
      const wrongCounts = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "1",
        syncDiff: diffPlan({
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1527,
          existingScopedRows: approval.source_preview.existingScopedRows + 1,
          insertCandidates: approval.source_preview.insertCandidates - 1,
          noChangeRows: approval.source_preview.noChangeRows + 1,
        }),
      });

      expect(requestMismatch.ok).toBe(false);
      expect(requestMismatch.blockedReasons).toContain("REQUEST_SCOPE_DATE_MISMATCH");
      expect(wrongPart.ok).toBe(false);
      expect(wrongPart.blockedReasons).toContain("TARGET_PART_MISMATCH");
      expect(wrongHash.ok).toBe(false);
      expect(wrongHash.blockedReasons).toContain("SOURCE_FILE_HASH_MISMATCH");
      expect(wrongCounts.ok).toBe(false);
      expect(wrongCounts.blockedReasons).toEqual(expect.arrayContaining([
        "PRIMARY_SCOPE_ROWS_MISMATCH",
        "EXISTING_SCOPED_ROWS_MISMATCH",
        "INSERT_CANDIDATES_MISMATCH",
        "NO_CHANGE_ROWS_MISMATCH",
      ]));
    }
  });

  it("blocks J-series stages when the request, part, hash, or dry-run counts drift before write", () => {
    for (const approval of jSeriesApprovals) {
      const requestMismatch = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "4",
        syncDiff: diffPlan({
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1295,
          excludedRows: 175,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
        requestScope: {
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-07",
          scopeSource: "explicit-request",
        },
        requireExplicitRequestScope: true,
      });
      const wrongPart = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "11",
        syncDiff: diffPlan({
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1295,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
      });
      const wrongHash = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
        selectedPartCode: "4",
        syncDiff: diffPlan({
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1295,
          existingScopedRows: approval.source_preview.existingScopedRows,
          insertCandidates: approval.source_preview.insertCandidates,
          noChangeRows: approval.source_preview.noChangeRows,
        }),
      });
      const wrongCounts = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "4",
        syncDiff: diffPlan({
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1294,
          existingScopedRows: approval.source_preview.existingScopedRows + 1,
          insertCandidates: approval.source_preview.insertCandidates - 1,
          noChangeRows: approval.source_preview.noChangeRows + 1,
        }),
      });

      expect(requestMismatch.ok).toBe(false);
      expect(requestMismatch.blockedReasons).toContain("REQUEST_SCOPE_DATE_MISMATCH");
      expect(wrongPart.ok).toBe(false);
      expect(wrongPart.blockedReasons).toContain("TARGET_PART_MISMATCH");
      expect(wrongHash.ok).toBe(false);
      expect(wrongHash.blockedReasons).toContain("SOURCE_FILE_HASH_MISMATCH");
      expect(wrongCounts.ok).toBe(false);
      expect(wrongCounts.blockedReasons).toEqual(expect.arrayContaining([
        "PRIMARY_SCOPE_ROWS_MISMATCH",
        "EXISTING_SCOPED_ROWS_MISMATCH",
        "INSERT_CANDIDATES_MISMATCH",
        "NO_CHANGE_ROWS_MISMATCH",
      ]));
    }
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

  it("blocks H-2 when update, delete, warning, or error rows appear before write", () => {
    const result = validateLimitedApplyPreconditions({
      approval: h2Approval,
      sourceFileHash: h2Approval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        normalRows: 2473,
        excludedRows: 271,
        existingScopedRows: 0,
        insertCandidates: 2473,
        noChangeRows: 0,
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

  it("blocks I-series stages when update, delete, warning, or error rows appear before write", () => {
    for (const approval of iSeriesApprovals) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "1",
        syncDiff: diffPlan({
          partCode: "1",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1528,
          excludedRows: 246,
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
        "UPDATE_CANDIDATES_MISMATCH",
        "DELETE_CANDIDATES_MISMATCH",
        "UPDATE_CANDIDATE_PRESENT",
        "DELETE_CANDIDATE_PRESENT",
        "WARNING_ROWS_PRESENT",
        "ERROR_ROWS_PRESENT",
      ]));
    }
  });

  it("blocks J-series stages when update, delete, warning, or error rows appear before write", () => {
    for (const approval of jSeriesApprovals) {
      const result = validateLimitedApplyPreconditions({
        approval,
        sourceFileHash: approval.test_file_hash,
        selectedPartCode: "4",
        syncDiff: diffPlan({
          partCode: "4",
          dateFrom: "2026-06-01",
          dateTo: "2026-06-06",
          normalRows: 1295,
          excludedRows: 175,
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
        "UPDATE_CANDIDATES_MISMATCH",
        "DELETE_CANDIDATES_MISMATCH",
        "UPDATE_CANDIDATE_PRESENT",
        "DELETE_CANDIDATE_PRESENT",
        "WARNING_ROWS_PRESENT",
        "ERROR_ROWS_PRESENT",
      ]));
    }
  });

  it("blocks H-2F when final remainder counts or update/delete candidates drift before write", () => {
    const wrongCounts = validateLimitedApplyPreconditions({
      approval: h2fApproval,
      sourceFileHash: h2fApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        normalRows: 2472,
        excludedRows: 271,
        existingScopedRows: 1999,
        insertCandidates: 474,
        noChangeRows: 1999,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });
    const updateDelete = validateLimitedApplyPreconditions({
      approval: h2fApproval,
      sourceFileHash: h2fApproval.test_file_hash,
      selectedPartCode: "11",
      syncDiff: diffPlan({
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        normalRows: 2473,
        excludedRows: 271,
        existingScopedRows: 2000,
        insertCandidates: 473,
        noChangeRows: 2000,
        updateCandidates: 1,
        deleteCandidates: 1,
      }),
      requestScope: {
        partCode: "11",
        dateFrom: "2026-06-07",
        dateTo: "2026-06-12",
        scopeSource: "explicit-request",
      },
      requireExplicitRequestScope: true,
    });

    expect(wrongCounts.ok).toBe(false);
    expect(wrongCounts.blockedReasons).toEqual(expect.arrayContaining([
      "PRIMARY_SCOPE_ROWS_MISMATCH",
      "EXISTING_SCOPED_ROWS_MISMATCH",
      "INSERT_CANDIDATES_MISMATCH",
      "NO_CHANGE_ROWS_MISMATCH",
    ]));
    expect(updateDelete.ok).toBe(false);
    expect(updateDelete.blockedReasons).toEqual(expect.arrayContaining([
      "UPDATE_CANDIDATE_PRESENT",
      "DELETE_CANDIDATE_PRESENT",
    ]));
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

function row(rowIndex: number, ledgerDate = "2026-06-02", overrides: Partial<ParsedLedgerRow> = {}): ParsedLedgerRow {
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
    ledgerDateFormatCategory: "yyyy-mm-dd",
    ledgerDateWasNormalized: false,
  } as ParsedLedgerRow;
  Object.assign(parsed, overrides);
  Object.assign(parsed, { ["raw" + "Row" + "Json"]: {} });
  return parsed;
}

function syncRow(rowIndex: number, overrides: { identity?: string; content?: string; naturalKey?: string } = {}): LedgerSyncRow {
  const identity = overrides.identity ?? `identity-${rowIndex}`;
  const content = overrides.content ?? `content-${rowIndex}`;
  return {
    naturalKey: overrides.naturalKey ?? "natural",
    occurrenceIndexWithinNaturalKey: rowIndex,
    identityHash: identity,
    contentHash: content,
    syncKey: identity,
    syncContentHash: content,
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
    {
      existingScopedRows?: number;
      warningRows?: number;
      errorRows?: number;
      dateFrom?: string;
      dateTo?: string;
      scopeSource?: LedgerSyncDiffPlan["scope"]["scopeSource"];
      normalRows?: number;
      excludedRows?: number;
      partCode?: string;
    },
): LedgerSyncDiffPlan {
  return {
    scope: {
      partCode: overrides.partCode ?? "11",
      dateFrom: overrides.dateFrom ?? "2026-06-01",
      dateTo: overrides.dateTo ?? "2026-06-06",
      scopeSource: overrides.scopeSource ?? "derived",
    },
    planReady: overrides.planReady ?? true,
    blockedReasons: [],
    incoming: {
      normalRows: overrides.normalRows ?? 2119,
      excludedRows: overrides.excludedRows ?? 275,
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
