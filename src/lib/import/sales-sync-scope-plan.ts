import {
  validateSalesSyncApprovalContract,
  type SalesSyncApprovalContract,
} from "@/lib/import/sales-sync-approval-contract";
import type { SalesImportRole } from "@/lib/auth/part-access";

export type SalesSyncScopePlan = {
  workflowGate: string;
  actorRole: SalesImportRole;
  actorId?: string;
  part: string;
  periodStart: string;
  periodEnd: string;
  fileHash: string;
  normalRows: number;
  excludedRows: number;
  amountTotal: number;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  removedFromCurrentCandidates: number;
  noChangeRows: number;
  amountBefore: number;
  amountAfter: number;
  amountDelta: number;
  rawRowsReturned: false;
  planReady: boolean;
};

export type SalesSyncScopeResult = {
  ok: boolean;
  workflowGate: string;
  part: string;
  periodStart: string;
  periodEnd: string;
  fileHash: string;
  insertedCount: number;
  updatedCount: number;
  removedFromCurrentCount: number;
  noChangeCount: number;
  amountBefore: number;
  amountAfter: number;
  amountDelta: number;
  rawRowsReturned: false;
  auditLogCreated: false;
};

export type SalesSyncScopeDryRunInput = {
  part: string;
  periodStart: string;
  periodEnd: string;
  fileHash: string;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  removedFromCurrentCandidates: number;
  noChangeRows: number;
  amountBefore: number;
  amountAfter: number;
  amountDelta: number;
  blockedRows: number;
  planReady: boolean;
  rawRowsReturned: boolean;
  blockedReasons?: string[];
};

export type SalesCurrentViewPolicy = {
  insert: "active_from_latest_xls";
  update: "changed_by_latest_xls";
  removedFromCurrent: "mark_not_in_latest_xls";
  noChange: "keep_active";
  physicalDelete: false;
};

export type SalesSyncScopeSideEffects = {
  dbWrite: false;
  storageWrite: false;
  sync: false;
  apply: false;
  physicalDelete: false;
  migration: false;
  seed: false;
  productionPost: false;
};

export function buildSalesSyncScopePlan(input: {
  approval: Partial<SalesSyncApprovalContract>;
  dryRun: SalesSyncScopeDryRunInput;
  actorManagedParts?: string[];
}) {
  const blockedReasons: string[] = [];
  const approvalValidation = validateSalesSyncApprovalContract(input.approval, {
    actorManagedParts: input.actorManagedParts,
    part: input.dryRun.part,
    periodStart: input.dryRun.periodStart,
    periodEnd: input.dryRun.periodEnd,
    fileHash: input.dryRun.fileHash,
    normalRows: input.dryRun.primaryScopeRows,
    amountTotal: input.dryRun.amountAfter,
    expectedPrimaryScopeRows: input.dryRun.primaryScopeRows,
    expectedExistingScopedRowsBeforeSync: input.dryRun.existingScopedRows,
    expectedInsertCandidates: input.dryRun.insertCandidates,
    expectedUpdateCandidates: input.dryRun.updateCandidates,
    expectedRemovedFromCurrentCandidates: input.dryRun.removedFromCurrentCandidates,
    expectedNoChangeRows: input.dryRun.noChangeRows,
    expectedAmountBefore: input.dryRun.amountBefore,
    expectedAmountAfter: input.dryRun.amountAfter,
    expectedAmountDelta: input.dryRun.amountDelta,
  });
  blockedReasons.push(...approvalValidation.blockedReasons);

  requireNonNegativeInteger(input.dryRun.primaryScopeRows, "SYNC_PLAN_PRIMARY_SCOPE_ROWS_INVALID", blockedReasons);
  requireNonNegativeInteger(input.dryRun.existingScopedRows, "SYNC_PLAN_EXISTING_SCOPED_ROWS_INVALID", blockedReasons);
  requireNonNegativeInteger(input.dryRun.insertCandidates, "SYNC_PLAN_INSERT_CANDIDATES_INVALID", blockedReasons);
  requireNonNegativeInteger(input.dryRun.updateCandidates, "SYNC_PLAN_UPDATE_CANDIDATES_INVALID", blockedReasons);
  requireNonNegativeInteger(input.dryRun.removedFromCurrentCandidates, "SYNC_PLAN_REMOVED_CANDIDATES_INVALID", blockedReasons);
  requireNonNegativeInteger(input.dryRun.noChangeRows, "SYNC_PLAN_NO_CHANGE_ROWS_INVALID", blockedReasons);
  requireNonNegativeInteger(input.dryRun.blockedRows, "SYNC_PLAN_BLOCKED_ROWS_INVALID", blockedReasons);
  requireNumber(input.dryRun.amountBefore, "SYNC_PLAN_AMOUNT_BEFORE_INVALID", blockedReasons);
  requireNumber(input.dryRun.amountAfter, "SYNC_PLAN_AMOUNT_AFTER_INVALID", blockedReasons);
  requireNumber(input.dryRun.amountDelta, "SYNC_PLAN_AMOUNT_DELTA_INVALID", blockedReasons);

  if (input.dryRun.rawRowsReturned !== false) blockedReasons.push("SYNC_PLAN_RAW_ROWS_RETURNED_MUST_BE_FALSE");
  if (!input.dryRun.planReady) blockedReasons.push("SYNC_PLAN_NOT_READY");
  if (input.dryRun.blockedRows > 0) blockedReasons.push("SYNC_PLAN_BLOCKED_ROWS_PRESENT");
  if (input.dryRun.amountAfter - input.dryRun.amountBefore !== input.dryRun.amountDelta) {
    blockedReasons.push("SYNC_PLAN_AMOUNT_DELTA_MISMATCH");
  }
  if (input.dryRun.primaryScopeRows !== input.dryRun.insertCandidates + input.dryRun.updateCandidates + input.dryRun.noChangeRows) {
    blockedReasons.push("SYNC_PLAN_SCOPE_COUNT_MISMATCH");
  }
  blockedReasons.push(...(input.dryRun.blockedReasons ?? []).map((reason) => `DRY_RUN_${reason}`));

  const uniqueBlockedReasons = [...new Set(blockedReasons)];
  const ok = uniqueBlockedReasons.length === 0;
  const currentViewPolicy = createSalesCurrentViewPolicy();
  const sideEffects = createNoWriteSideEffects();
  const plan = ok ? createPlan(input.approval as SalesSyncApprovalContract, input.dryRun) : null;

  return {
    ok,
    blockedReasons: uniqueBlockedReasons,
    plan,
    resultPreview: plan ? createResultPreview(plan) : null,
    currentViewPolicy,
    sideEffects,
  };
}

export function createSalesCurrentViewPolicy(): SalesCurrentViewPolicy {
  return {
    insert: "active_from_latest_xls",
    update: "changed_by_latest_xls",
    removedFromCurrent: "mark_not_in_latest_xls",
    noChange: "keep_active",
    physicalDelete: false,
  };
}

export function createNoWriteSideEffects(): SalesSyncScopeSideEffects {
  return {
    dbWrite: false,
    storageWrite: false,
    sync: false,
    apply: false,
    physicalDelete: false,
    migration: false,
    seed: false,
    productionPost: false,
  };
}

function createPlan(approval: SalesSyncApprovalContract, dryRun: SalesSyncScopeDryRunInput): SalesSyncScopePlan {
  return {
    workflowGate: approval.workflowGate,
    actorRole: approval.actorRole,
    actorId: approval.actorId,
    part: dryRun.part,
    periodStart: dryRun.periodStart,
    periodEnd: dryRun.periodEnd,
    fileHash: dryRun.fileHash,
    normalRows: approval.normalRows,
    excludedRows: approval.excludedRows,
    amountTotal: approval.amountTotal,
    primaryScopeRows: dryRun.primaryScopeRows,
    existingScopedRows: dryRun.existingScopedRows,
    insertCandidates: dryRun.insertCandidates,
    updateCandidates: dryRun.updateCandidates,
    removedFromCurrentCandidates: dryRun.removedFromCurrentCandidates,
    noChangeRows: dryRun.noChangeRows,
    amountBefore: dryRun.amountBefore,
    amountAfter: dryRun.amountAfter,
    amountDelta: dryRun.amountDelta,
    rawRowsReturned: false,
    planReady: dryRun.planReady,
  };
}

function createResultPreview(plan: SalesSyncScopePlan): SalesSyncScopeResult {
  return {
    ok: true,
    workflowGate: plan.workflowGate,
    part: plan.part,
    periodStart: plan.periodStart,
    periodEnd: plan.periodEnd,
    fileHash: plan.fileHash,
    insertedCount: plan.insertCandidates,
    updatedCount: plan.updateCandidates,
    removedFromCurrentCount: plan.removedFromCurrentCandidates,
    noChangeCount: plan.noChangeRows,
    amountBefore: plan.amountBefore,
    amountAfter: plan.amountAfter,
    amountDelta: plan.amountDelta,
    rawRowsReturned: false,
    auditLogCreated: false,
  };
}

function requireNonNegativeInteger(value: unknown, code: string, blockedReasons: string[]) {
  if (!Number.isInteger(value) || Number(value) < 0) blockedReasons.push(code);
}

function requireNumber(value: unknown, code: string, blockedReasons: string[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) blockedReasons.push(code);
}
