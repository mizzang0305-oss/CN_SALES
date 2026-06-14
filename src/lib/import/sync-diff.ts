import type { LedgerSyncRow } from "@/lib/import/sync-key";

export interface LedgerSyncScope {
  partCode: string;
  dateFrom: string;
  dateTo: string;
}

export interface LedgerSyncDiffPlan {
  scope: LedgerSyncScope;
  planReady: boolean;
  blockedReasons: string[];
  incoming: {
    normalRows: number;
    excludedRows: number;
    warningRows: number;
    errorRows: number;
  };
  existing: {
    scopedRows: number;
  };
  diff: {
    insertCandidates: number;
    updateCandidates: number;
    deleteCandidates: number;
    noChangeRows: number;
    duplicateIncomingKeys: number;
    duplicateExistingKeys: number;
  };
  safety: {
    dbWriteExecuted: false;
    deleteExecuted: false;
    productionPostExecuted: false;
  };
  readOnlyEvidence: {
    readExecuted: boolean;
    readBlockedReason: string | null;
    selectedColumnsOnly: true;
    selectStarUsed: false;
  };
}

export function deriveLedgerSyncScope(input: {
  partCode: string;
  dates: string[];
  fallbackDateFrom: string;
  fallbackDateTo: string;
}): LedgerSyncScope {
  const dates = input.dates.filter(isIsoDate).sort();
  return {
    partCode: input.partCode,
    dateFrom: dates[0] ?? input.fallbackDateFrom,
    dateTo: dates.at(-1) ?? input.fallbackDateTo,
  };
}

export function planLedgerSyncDiff(input: {
  scope: LedgerSyncScope;
  incomingRows: LedgerSyncRow[];
  existingRows: LedgerSyncRow[];
  incomingSummary: LedgerSyncDiffPlan["incoming"];
  readOnlyEvidence?: Partial<LedgerSyncDiffPlan["readOnlyEvidence"]>;
}): LedgerSyncDiffPlan {
  const incomingByKey = firstBySyncKey(input.incomingRows);
  const existingByKey = firstBySyncKey(input.existingRows);
  const duplicateIncomingKeys = duplicateKeyCount(input.incomingRows);
  const duplicateExistingKeys = duplicateKeyCount(input.existingRows);
  const blockedReasons = [
    ...(duplicateIncomingKeys > 0 ? ["DUPLICATE_INCOMING_SYNC_KEYS"] : []),
    ...(duplicateExistingKeys > 0 ? ["DUPLICATE_EXISTING_SYNC_KEYS"] : []),
    ...(input.readOnlyEvidence?.readBlockedReason ? [input.readOnlyEvidence.readBlockedReason] : []),
  ];
  let insertCandidates = 0;
  let updateCandidates = 0;
  let noChangeRows = 0;

  for (const incoming of input.incomingRows) {
    const existing = existingByKey.get(incoming.syncKey);
    if (!existing) {
      insertCandidates += 1;
      continue;
    }

    if (existing.syncContentHash === incoming.syncContentHash) {
      noChangeRows += 1;
    } else {
      updateCandidates += 1;
    }
  }

  let deleteCandidates = 0;
  for (const existing of input.existingRows) {
    if (!incomingByKey.has(existing.syncKey)) {
      deleteCandidates += 1;
    }
  }

  return {
    scope: input.scope,
    planReady: blockedReasons.length === 0,
    blockedReasons,
    incoming: input.incomingSummary,
    existing: {
      scopedRows: input.existingRows.length,
    },
    diff: {
      insertCandidates,
      updateCandidates,
      deleteCandidates,
      noChangeRows,
      duplicateIncomingKeys,
      duplicateExistingKeys,
    },
    safety: {
      dbWriteExecuted: false,
      deleteExecuted: false,
      productionPostExecuted: false,
    },
    readOnlyEvidence: {
      readExecuted: input.readOnlyEvidence?.readExecuted ?? false,
      readBlockedReason: input.readOnlyEvidence?.readBlockedReason ?? null,
      selectedColumnsOnly: true,
      selectStarUsed: false,
    },
  };
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function firstBySyncKey(rows: LedgerSyncRow[]) {
  const map = new Map<string, LedgerSyncRow>();
  for (const row of rows) {
    if (!map.has(row.syncKey)) {
      map.set(row.syncKey, row);
    }
  }
  return map;
}

function duplicateKeyCount(rows: LedgerSyncRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.syncKey, (counts.get(row.syncKey) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}
