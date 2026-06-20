import type { OperationalPreviewSummary } from "@/lib/import/preview-checksum";
import type { LedgerSyncDiffPlan } from "@/lib/import/sync-diff";
import type { SalesImportPreviewAccessResult } from "@/lib/web-import/sales-preview";

export type SalesImportDryRunContractInput = {
  fileHash?: string | null;
  part?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  normalRows?: number | null;
  excludedRows?: number | null;
  amountTotal?: number | null;
  warningRows?: number | null;
  errorRows?: number | null;
};

export type SalesImportDryRunResponse = {
  ok: true;
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
  rawRowsReturned: false;
  blockedReasons: string[];
  permission: {
    role: string;
    allowedParts: string[];
    crossPartBlocked: false;
  };
  sideEffects: {
    dbWrite: false;
    storageWrite: false;
    sync: false;
    apply: false;
    physicalDelete: false;
  };
};

export function validateSalesImportDryRunContract(input: {
  expected: SalesImportDryRunContractInput;
  actual: {
    fileHash: string;
    part: string;
    periodStart: string;
    periodEnd: string;
    operationalSummary: OperationalPreviewSummary;
  };
}) {
  const blockedReasons: string[] = [];

  if (!input.expected.fileHash || input.expected.fileHash !== input.actual.fileHash) {
    blockedReasons.push("FILE_HASH_MISMATCH");
  }

  if (!input.expected.part || input.expected.part !== input.actual.part) {
    blockedReasons.push("PART_MISMATCH");
  }

  if (!input.expected.periodStart || !input.expected.periodEnd) {
    blockedReasons.push("PERIOD_REQUIRED");
  } else if (input.expected.periodStart !== input.actual.periodStart || input.expected.periodEnd !== input.actual.periodEnd) {
    blockedReasons.push("PERIOD_MISMATCH");
  }

  if (!sameOptionalNumber(input.expected.normalRows, input.actual.operationalSummary.normalRows)) {
    blockedReasons.push("NORMAL_ROWS_MISMATCH");
  }

  if (!sameOptionalNumber(input.expected.excludedRows, input.actual.operationalSummary.excludedRows)) {
    blockedReasons.push("EXCLUDED_ROWS_MISMATCH");
  }

  if (!sameOptionalNumber(input.expected.amountTotal, input.actual.operationalSummary.amountTotal)) {
    blockedReasons.push("AMOUNT_TOTAL_MISMATCH");
  }

  if (!sameOptionalNumber(input.expected.warningRows, input.actual.operationalSummary.warningRows)) {
    blockedReasons.push("WARNING_ROWS_MISMATCH");
  }

  if (!sameOptionalNumber(input.expected.errorRows, input.actual.operationalSummary.errorRows)) {
    blockedReasons.push("ERROR_ROWS_MISMATCH");
  }

  return {
    ok: blockedReasons.length === 0,
    blockedReasons,
  };
}

export function createSalesImportDryRunResponse(input: {
  fileHash: string;
  part: string;
  periodStart: string;
  periodEnd: string;
  operationalSummary: OperationalPreviewSummary;
  syncDiff: LedgerSyncDiffPlan;
  amountBefore: number;
  access: SalesImportPreviewAccessResult;
}): SalesImportDryRunResponse {
  const amountAfter = input.operationalSummary.amountTotal;

  return {
    ok: true,
    part: input.part,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    fileHash: input.fileHash,
    primaryScopeRows: input.operationalSummary.normalRows,
    existingScopedRows: input.syncDiff.existing.scopedRows,
    insertCandidates: input.syncDiff.diff.insertCandidates,
    updateCandidates: input.syncDiff.diff.updateCandidates,
    removedFromCurrentCandidates: input.syncDiff.diff.deleteCandidates,
    noChangeRows: input.syncDiff.diff.noChangeRows,
    amountBefore: input.amountBefore,
    amountAfter,
    amountDelta: amountAfter - input.amountBefore,
    blockedRows: input.operationalSummary.warningRows + input.operationalSummary.errorRows,
    planReady: input.syncDiff.planReady,
    rawRowsReturned: false,
    blockedReasons: input.syncDiff.blockedReasons,
    permission: {
      role: input.access.role,
      allowedParts: input.access.allowedParts,
      crossPartBlocked: false,
    },
    sideEffects: {
      dbWrite: false,
      storageWrite: false,
      sync: false,
      apply: false,
      physicalDelete: false,
    },
  };
}

export function sumLedgerSyncAmount(rows: Array<{ amountTotal?: number }>) {
  return rows.reduce((sum, row) => sum + Number(row.amountTotal ?? 0), 0);
}

function sameOptionalNumber(expected: number | null | undefined, actual: number) {
  if (expected === null || expected === undefined) return true;
  return Number.isFinite(expected) && expected === actual;
}
