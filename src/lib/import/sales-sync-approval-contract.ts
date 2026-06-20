import { validateSalesPartAccess, type SalesImportRole } from "@/lib/auth/part-access";

export type SalesSyncApprovalContract = {
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
  expectedPrimaryScopeRows: number;
  expectedExistingScopedRowsBeforeSync: number;
  expectedInsertCandidates: number;
  expectedUpdateCandidates: number;
  expectedRemovedFromCurrentCandidates: number;
  expectedNoChangeRows: number;
  expectedAmountBefore: number;
  expectedAmountAfter: number;
  expectedAmountDelta: number;
  rawRowsReturned: false;
};

export type SalesSyncApprovalValidationExpected = {
  workflowGate?: string;
  actorManagedParts?: string[];
  part?: string;
  periodStart?: string;
  periodEnd?: string;
  fileHash?: string;
  normalRows?: number;
  excludedRows?: number;
  amountTotal?: number;
  expectedPrimaryScopeRows?: number;
  expectedExistingScopedRowsBeforeSync?: number;
  expectedInsertCandidates?: number;
  expectedUpdateCandidates?: number;
  expectedRemovedFromCurrentCandidates?: number;
  expectedNoChangeRows?: number;
  expectedAmountBefore?: number;
  expectedAmountAfter?: number;
  expectedAmountDelta?: number;
};

export function validateSalesSyncApprovalContract(
  contract: Partial<SalesSyncApprovalContract>,
  expected: SalesSyncApprovalValidationExpected = {},
) {
  const blockedReasons: string[] = [];

  requireText(contract.workflowGate, "APPROVAL_WORKFLOW_GATE_REQUIRED", blockedReasons);
  requireText(contract.fileHash, "APPROVAL_FILE_HASH_REQUIRED", blockedReasons);
  requireIsoDate(contract.periodStart, "APPROVAL_PERIOD_START_INVALID", blockedReasons);
  requireIsoDate(contract.periodEnd, "APPROVAL_PERIOD_END_INVALID", blockedReasons);

  const partAccess = validateSalesPartAccess({
    role: contract.actorRole,
    partCode: contract.part,
    managedParts: expected.actorManagedParts,
  });
  if (!partAccess.ok) blockedReasons.push(...partAccess.blockedReasons.map((reason) => `APPROVAL_${reason}`));

  requireNonNegativeInteger(contract.normalRows, "APPROVAL_NORMAL_ROWS_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.excludedRows, "APPROVAL_EXCLUDED_ROWS_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.amountTotal, "APPROVAL_AMOUNT_TOTAL_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.expectedPrimaryScopeRows, "APPROVAL_PRIMARY_SCOPE_ROWS_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.expectedExistingScopedRowsBeforeSync, "APPROVAL_EXISTING_SCOPED_ROWS_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.expectedInsertCandidates, "APPROVAL_INSERT_CANDIDATES_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.expectedUpdateCandidates, "APPROVAL_UPDATE_CANDIDATES_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.expectedRemovedFromCurrentCandidates, "APPROVAL_REMOVED_CANDIDATES_INVALID", blockedReasons);
  requireNonNegativeInteger(contract.expectedNoChangeRows, "APPROVAL_NO_CHANGE_ROWS_INVALID", blockedReasons);
  requireNumber(contract.expectedAmountBefore, "APPROVAL_AMOUNT_BEFORE_INVALID", blockedReasons);
  requireNumber(contract.expectedAmountAfter, "APPROVAL_AMOUNT_AFTER_INVALID", blockedReasons);
  requireNumber(contract.expectedAmountDelta, "APPROVAL_AMOUNT_DELTA_INVALID", blockedReasons);

  if (contract.rawRowsReturned !== false) {
    blockedReasons.push("APPROVAL_RAW_ROWS_RETURNED_MUST_BE_FALSE");
  }

  if (
    typeof contract.expectedAmountBefore === "number" &&
    typeof contract.expectedAmountAfter === "number" &&
    typeof contract.expectedAmountDelta === "number" &&
    contract.expectedAmountAfter - contract.expectedAmountBefore !== contract.expectedAmountDelta
  ) {
    blockedReasons.push("APPROVAL_AMOUNT_DELTA_MISMATCH");
  }

  compareExpected(contract.workflowGate, expected.workflowGate, "APPROVAL_WORKFLOW_GATE_MISMATCH", blockedReasons);
  compareExpected(contract.part, expected.part, "APPROVAL_PART_MISMATCH", blockedReasons);
  compareExpected(contract.periodStart, expected.periodStart, "APPROVAL_PERIOD_START_MISMATCH", blockedReasons);
  compareExpected(contract.periodEnd, expected.periodEnd, "APPROVAL_PERIOD_END_MISMATCH", blockedReasons);
  compareExpected(contract.fileHash, expected.fileHash, "APPROVAL_FILE_HASH_MISMATCH", blockedReasons);
  compareExpected(contract.normalRows, expected.normalRows, "APPROVAL_NORMAL_ROWS_MISMATCH", blockedReasons);
  compareExpected(contract.excludedRows, expected.excludedRows, "APPROVAL_EXCLUDED_ROWS_MISMATCH", blockedReasons);
  compareExpected(contract.amountTotal, expected.amountTotal, "APPROVAL_AMOUNT_TOTAL_MISMATCH", blockedReasons);
  compareExpected(contract.expectedPrimaryScopeRows, expected.expectedPrimaryScopeRows, "APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH", blockedReasons);
  compareExpected(
    contract.expectedExistingScopedRowsBeforeSync,
    expected.expectedExistingScopedRowsBeforeSync,
    "APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH",
    blockedReasons,
  );
  compareExpected(contract.expectedInsertCandidates, expected.expectedInsertCandidates, "APPROVAL_INSERT_CANDIDATES_MISMATCH", blockedReasons);
  compareExpected(contract.expectedUpdateCandidates, expected.expectedUpdateCandidates, "APPROVAL_UPDATE_CANDIDATES_MISMATCH", blockedReasons);
  compareExpected(
    contract.expectedRemovedFromCurrentCandidates,
    expected.expectedRemovedFromCurrentCandidates,
    "APPROVAL_REMOVED_CANDIDATES_MISMATCH",
    blockedReasons,
  );
  compareExpected(contract.expectedNoChangeRows, expected.expectedNoChangeRows, "APPROVAL_NO_CHANGE_ROWS_MISMATCH", blockedReasons);
  compareExpected(contract.expectedAmountBefore, expected.expectedAmountBefore, "APPROVAL_AMOUNT_BEFORE_MISMATCH", blockedReasons);
  compareExpected(contract.expectedAmountAfter, expected.expectedAmountAfter, "APPROVAL_AMOUNT_AFTER_MISMATCH", blockedReasons);
  compareExpected(contract.expectedAmountDelta, expected.expectedAmountDelta, "APPROVAL_AMOUNT_DELTA_EXPECTED_MISMATCH", blockedReasons);

  return {
    ok: blockedReasons.length === 0,
    blockedReasons: [...new Set(blockedReasons)],
  };
}

function requireText(value: unknown, code: string, blockedReasons: string[]) {
  if (typeof value !== "string" || value.trim() === "") blockedReasons.push(code);
}

function requireIsoDate(value: unknown, code: string, blockedReasons: string[]) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) blockedReasons.push(code);
}

function requireNonNegativeInteger(value: unknown, code: string, blockedReasons: string[]) {
  if (!Number.isInteger(value) || Number(value) < 0) blockedReasons.push(code);
}

function requireNumber(value: unknown, code: string, blockedReasons: string[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) blockedReasons.push(code);
}

function compareExpected<T>(actual: T | undefined, expected: T | undefined, code: string, blockedReasons: string[]) {
  if (expected !== undefined && actual !== expected) blockedReasons.push(code);
}
