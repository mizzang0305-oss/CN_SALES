import type { LedgerSyncRow } from "@/lib/import/sync-key";

export interface LedgerSyncScope {
  partCode: string;
  dateFrom: string;
  dateTo: string;
  scopeSource: "explicit-request" | "derived" | "fallback";
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
    duplicateIncomingIdentityHashes: number;
    duplicateExistingIdentityHashes: number;
  };
  diagnostics: {
    incomingIdentity: DuplicateSyncKeySummary;
    existingIdentity: DuplicateSyncKeySummary;
    incomingNaturalKey: DuplicateSyncKeySummary;
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
    reader?: LedgerSyncReadOnlyReaderEvidence | null;
  };
}

export interface LedgerSyncReadOnlyReaderEvidence {
  paged: true;
  pageSize: number;
  pagesRead: number;
  fetchedRows: number;
  expectedCount: number | null;
  countMatchesFetchedRows: boolean | null;
  rawRowsReturned: false;
}

export interface DuplicateSyncKeySummary {
  duplicateKeyCount: number;
  duplicateRowCount: number;
  maxDuplicateGroupSize: number;
  groupsWithSameContentHash: number;
  groupsWithMixedContentHash: number;
}

export function deriveLedgerSyncScope(input: {
  partCode: string;
  dates: string[];
  fallbackDateFrom: string;
  fallbackDateTo: string;
  explicitDateFrom?: string;
  explicitDateTo?: string;
}): LedgerSyncScope {
  if (input.explicitDateFrom && input.explicitDateTo) {
    return {
      partCode: input.partCode,
      dateFrom: input.explicitDateFrom,
      dateTo: input.explicitDateTo,
      scopeSource: "explicit-request",
    };
  }

  const dates = input.dates.filter(isIsoDate).sort();
  return {
    partCode: input.partCode,
    dateFrom: dates[0] ?? input.fallbackDateFrom,
    dateTo: dates.at(-1) ?? input.fallbackDateTo,
    scopeSource: dates.length > 0 ? "derived" : "fallback",
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
  const incomingIdentityDiagnostics = summarizeDuplicateSyncKeys(input.incomingRows);
  const existingIdentityDiagnostics = summarizeDuplicateSyncKeys(input.existingRows);
  const incomingNaturalKeyDiagnostics = summarizeDuplicateNaturalKeys(input.incomingRows);
  const duplicateIncomingKeys = incomingIdentityDiagnostics.duplicateKeyCount;
  const duplicateExistingKeys = existingIdentityDiagnostics.duplicateKeyCount;
  const blockedReasons = [
    ...(duplicateIncomingKeys > 0 ? ["DUPLICATE_INCOMING_SYNC_KEYS"] : []),
    ...(duplicateExistingKeys > 0 ? ["DUPLICATE_EXISTING_SYNC_KEYS"] : []),
    ...(input.incomingSummary.warningRows > 0 ? ["HAS_WARNING_ROWS"] : []),
    ...(input.incomingSummary.errorRows > 0 ? ["HAS_ERROR_ROWS"] : []),
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
      duplicateIncomingIdentityHashes: duplicateIncomingKeys,
      duplicateExistingIdentityHashes: duplicateExistingKeys,
    },
    diagnostics: {
      incomingIdentity: incomingIdentityDiagnostics,
      existingIdentity: existingIdentityDiagnostics,
      incomingNaturalKey: incomingNaturalKeyDiagnostics,
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
      reader: input.readOnlyEvidence?.reader ?? null,
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

export function summarizeDuplicateSyncKeys(rows: LedgerSyncRow[]): DuplicateSyncKeySummary {
  return summarizeDuplicateGroups(rows.map((row) => ({
    key: row.syncKey,
    contentHash: row.syncContentHash,
  })));
}

function summarizeDuplicateNaturalKeys(rows: LedgerSyncRow[]): DuplicateSyncKeySummary {
  return summarizeDuplicateGroups(rows.map((row) => ({
    key: row.naturalKey,
    contentHash: row.syncContentHash,
  })));
}

function summarizeDuplicateGroups(rows: Array<{ key: string; contentHash: string }>): DuplicateSyncKeySummary {
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const contentHashes = groups.get(row.key) ?? [];
    contentHashes.push(row.contentHash);
    groups.set(row.key, contentHashes);
  }
  const duplicateGroups = [...groups.values()].filter((contentHashes) => contentHashes.length > 1);

  return {
    duplicateKeyCount: duplicateGroups.length,
    duplicateRowCount: duplicateGroups.reduce((sum, contentHashes) => sum + contentHashes.length, 0),
    maxDuplicateGroupSize: duplicateGroups.reduce((max, contentHashes) => Math.max(max, contentHashes.length), 0),
    groupsWithSameContentHash: duplicateGroups.filter((contentHashes) => new Set(contentHashes).size === 1).length,
    groupsWithMixedContentHash: duplicateGroups.filter((contentHashes) => new Set(contentHashes).size > 1).length,
  };
}
