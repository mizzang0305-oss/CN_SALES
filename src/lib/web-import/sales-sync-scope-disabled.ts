import { validateSalesPartAccess, type SalesImportRole } from "@/lib/auth/part-access";
import {
  buildSalesSyncScopePlan,
  createNoWriteSideEffects,
  type SalesSyncScopeDryRunInput,
} from "@/lib/import/sales-sync-scope-plan";
import {
  validateSalesSyncApprovalContract,
  type SalesSyncApprovalContract,
} from "@/lib/import/sales-sync-approval-contract";

export type SalesSyncScopeDisabledRequest = {
  approval: Partial<SalesSyncApprovalContract>;
  dryRun: Partial<SalesSyncScopeDryRunInput>;
  actorManagedParts: string[];
};

export type SalesSyncScopeDisabledResponse = {
  ok: false;
  status: "approval_required";
  syncEnabled: false;
  message: string;
  rawRowsReturned: false;
  requiredApprovals: {
    schema: "WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED";
    execution: "WEB_ERP_XLS_SYNC_EXECUTE_APPROVED";
  };
  validation: {
    roleScopeChecked: boolean;
    roleScopeOk: boolean;
    approvalContractChecked: boolean;
    approvalContractOk: boolean;
    syncPlanChecked: boolean;
    syncPlanOk: boolean;
    blockedReasons: string[];
  };
  sideEffects: ReturnType<typeof createNoWriteSideEffects>;
};

export function createDisabledSalesSyncScopeResponse(input: SalesSyncScopeDisabledRequest): SalesSyncScopeDisabledResponse {
  const blockedReasons = new Set<string>(["SYNC_SCOPE_SCHEMA_APPROVAL_REQUIRED", "SYNC_SCOPE_EXECUTION_APPROVAL_REQUIRED"]);
  const roleScopeChecked = Boolean(input.approval.actorRole && input.approval.part);
  const roleScope = roleScopeChecked
    ? validateSalesPartAccess({
      role: input.approval.actorRole,
      partCode: input.approval.part,
      managedParts: input.actorManagedParts,
    })
    : null;
  roleScope?.blockedReasons.forEach((reason) => blockedReasons.add(`SYNC_SCOPE_${reason}`));

  const approvalContractChecked = hasApprovalContractInput(input.approval);
  const approvalContract = approvalContractChecked
    ? validateSalesSyncApprovalContract(input.approval, {
      actorManagedParts: input.actorManagedParts,
      part: input.approval.part,
      periodStart: input.approval.periodStart,
      periodEnd: input.approval.periodEnd,
      fileHash: input.approval.fileHash,
      normalRows: input.approval.normalRows,
      excludedRows: input.approval.excludedRows,
      amountTotal: input.approval.amountTotal,
      expectedPrimaryScopeRows: input.approval.expectedPrimaryScopeRows,
      expectedExistingScopedRowsBeforeSync: input.approval.expectedExistingScopedRowsBeforeSync,
      expectedInsertCandidates: input.approval.expectedInsertCandidates,
      expectedUpdateCandidates: input.approval.expectedUpdateCandidates,
      expectedRemovedFromCurrentCandidates: input.approval.expectedRemovedFromCurrentCandidates,
      expectedNoChangeRows: input.approval.expectedNoChangeRows,
      expectedAmountBefore: input.approval.expectedAmountBefore,
      expectedAmountAfter: input.approval.expectedAmountAfter,
      expectedAmountDelta: input.approval.expectedAmountDelta,
    })
    : null;
  approvalContract?.blockedReasons.forEach((reason) => blockedReasons.add(reason));

  const dryRun = toCompleteDryRun(input.dryRun);
  const canCheckSyncPlan = Boolean(approvalContract?.ok && dryRun);
  const syncPlan = approvalContract?.ok && dryRun
    ? buildSalesSyncScopePlan({
      approval: input.approval,
      dryRun,
      actorManagedParts: input.actorManagedParts,
    })
    : null;
  syncPlan?.blockedReasons.forEach((reason) => blockedReasons.add(reason));

  return {
    ok: false,
    status: "approval_required",
    syncEnabled: false,
    message: "Current-view sync requires explicit schema/apply approval.",
    rawRowsReturned: false,
    requiredApprovals: {
      schema: "WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED",
      execution: "WEB_ERP_XLS_SYNC_EXECUTE_APPROVED",
    },
    validation: {
      roleScopeChecked,
      roleScopeOk: roleScope?.ok ?? false,
      approvalContractChecked,
      approvalContractOk: approvalContract?.ok ?? false,
      syncPlanChecked: canCheckSyncPlan,
      syncPlanOk: syncPlan?.ok ?? false,
      blockedReasons: [...blockedReasons],
    },
    sideEffects: createNoWriteSideEffects(),
  };
}

function hasApprovalContractInput(approval: Partial<SalesSyncApprovalContract>) {
  return Boolean(approval.workflowGate || approval.actorRole || approval.part || approval.periodStart || approval.periodEnd || approval.fileHash);
}

function toCompleteDryRun(input: Partial<SalesSyncScopeDryRunInput>): SalesSyncScopeDryRunInput | null {
  if (
    typeof input.part !== "string" ||
    typeof input.periodStart !== "string" ||
    typeof input.periodEnd !== "string" ||
    typeof input.fileHash !== "string" ||
    !isNumber(input.primaryScopeRows) ||
    !isNumber(input.existingScopedRows) ||
    !isNumber(input.insertCandidates) ||
    !isNumber(input.updateCandidates) ||
    !isNumber(input.removedFromCurrentCandidates) ||
    !isNumber(input.noChangeRows) ||
    !isNumber(input.amountBefore) ||
    !isNumber(input.amountAfter) ||
    !isNumber(input.amountDelta) ||
    !isNumber(input.blockedRows) ||
    typeof input.planReady !== "boolean" ||
    typeof input.rawRowsReturned !== "boolean"
  ) {
    return null;
  }

  return {
    part: input.part,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    fileHash: input.fileHash,
    primaryScopeRows: input.primaryScopeRows,
    existingScopedRows: input.existingScopedRows,
    insertCandidates: input.insertCandidates,
    updateCandidates: input.updateCandidates,
    removedFromCurrentCandidates: input.removedFromCurrentCandidates,
    noChangeRows: input.noChangeRows,
    amountBefore: input.amountBefore,
    amountAfter: input.amountAfter,
    amountDelta: input.amountDelta,
    blockedRows: input.blockedRows,
    planReady: input.planReady,
    rawRowsReturned: input.rawRowsReturned,
    blockedReasons: input.blockedReasons ?? [],
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeSyncScopeActorRole(value: unknown): SalesImportRole | undefined {
  return typeof value === "string" ? (value as SalesImportRole) : undefined;
}
