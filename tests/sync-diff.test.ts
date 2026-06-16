import { describe, expect, it } from "vitest";
import { deriveLedgerSyncScope, planLedgerSyncDiff, summarizeDuplicateSyncKeys } from "@/lib/import/sync-diff";
import type { LedgerSyncRow } from "@/lib/import/sync-key";

const scope = {
  partCode: "11",
  dateFrom: "2026-06-01",
  dateTo: "2026-06-06",
  scopeSource: "derived" as const,
};

describe("ledger sync diff planner", () => {
  it("derives scope only from ISO ledger dates and ignores label-like values", () => {
    expect(deriveLedgerSyncScope({
      partCode: "11",
      dates: ["2026-06-01", "【 업체계 】", "2026-06-06"],
      fallbackDateFrom: "2026-06-01",
      fallbackDateTo: "2026-06-30",
    })).toEqual({
      partCode: "11",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-06",
      scopeSource: "derived",
    });
  });

  it("uses explicit request period before derived ISO ledger dates", () => {
    expect(deriveLedgerSyncScope({
      partCode: "11",
      dates: ["2026-06-01", "2026-06-30"],
      fallbackDateFrom: "2026-06-01",
      fallbackDateTo: "2026-06-30",
      explicitDateFrom: "2026-06-01",
      explicitDateTo: "2026-06-06",
    })).toEqual({
      partCode: "11",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-06",
      scopeSource: "explicit-request",
    });
  });

  it("marks incoming-only rows as insert candidates", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [syncRow("key-a", "hash-a")],
      existingRows: [],
      incomingSummary: summary(1),
    });

    expect(plan.diff.insertCandidates).toBe(1);
    expect(plan.diff.updateCandidates).toBe(0);
    expect(plan.diff.deleteCandidates).toBe(0);
    expect(plan.diff.noChangeRows).toBe(0);
    expect(plan.safety.deleteExecuted).toBe(false);
    expect(plan.safety.dbWriteExecuted).toBe(false);
  });

  it("marks equal sync key and equal content hash as no-change", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [syncRow("key-a", "hash-a")],
      existingRows: [syncRow("key-a", "hash-a")],
      incomingSummary: summary(1),
    });

    expect(plan.diff.noChangeRows).toBe(1);
    expect(plan.diff.insertCandidates).toBe(0);
    expect(plan.diff.updateCandidates).toBe(0);
    expect(plan.diff.deleteCandidates).toBe(0);
  });

  it("plans the post-G-6G dry-run target after paging 1133 existing rows", () => {
    const existingRows = numberedSyncRows(1133);
    const incomingRows = numberedSyncRows(2119);
    const reader = {
      paged: true as const,
      pageSize: 500,
      pagesRead: 3,
      fetchedRows: 1133,
      expectedCount: 1133,
      countMatchesFetchedRows: true,
      rawRowsReturned: false as const,
    };
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows,
      existingRows,
      incomingSummary: summary(incomingRows.length),
      readOnlyEvidence: {
        readExecuted: true,
        readBlockedReason: null,
        reader,
      },
    });

    expect(plan.existing.scopedRows).toBe(1133);
    expect(plan.diff.insertCandidates).toBe(986);
    expect(plan.diff.updateCandidates).toBe(0);
    expect(plan.diff.deleteCandidates).toBe(0);
    expect(plan.diff.noChangeRows).toBe(1133);
    expect(plan.planReady).toBe(true);
    expect(plan.readOnlyEvidence.reader).toEqual(reader);
  });

  it("plans final no-change after all 2119 incoming rows are already synced", () => {
    const existingRows = numberedSyncRows(2119);
    const incomingRows = numberedSyncRows(2119);
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows,
      existingRows,
      incomingSummary: summary(incomingRows.length),
      readOnlyEvidence: {
        readExecuted: true,
        readBlockedReason: null,
        reader: {
          paged: true,
          pageSize: 500,
          pagesRead: 5,
          fetchedRows: 2119,
          expectedCount: 2119,
          countMatchesFetchedRows: true,
          rawRowsReturned: false,
        },
      },
    });

    expect(plan.existing.scopedRows).toBe(2119);
    expect(plan.diff.insertCandidates).toBe(0);
    expect(plan.diff.updateCandidates).toBe(0);
    expect(plan.diff.deleteCandidates).toBe(0);
    expect(plan.diff.noChangeRows).toBe(2119);
    expect(plan.planReady).toBe(true);
  });

  it("marks equal sync key and different content hash as update", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [syncRow("key-a", "hash-b")],
      existingRows: [syncRow("key-a", "hash-a")],
      incomingSummary: summary(1),
    });

    expect(plan.diff.updateCandidates).toBe(1);
    expect(plan.diff.insertCandidates).toBe(0);
    expect(plan.diff.noChangeRows).toBe(0);
  });

  it("marks existing-only scoped rows as delete candidates without executing delete", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [syncRow("key-a", "hash-a")],
      existingRows: [syncRow("key-a", "hash-a"), syncRow("key-b", "hash-b")],
      incomingSummary: summary(1),
    });

    expect(plan.diff.deleteCandidates).toBe(1);
    expect(plan.safety.deleteExecuted).toBe(false);
  });

  it("reports duplicate incoming and existing keys", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [syncRow("key-a", "hash-a"), syncRow("key-a", "hash-a")],
      existingRows: [syncRow("key-b", "hash-b"), syncRow("key-b", "hash-b")],
      incomingSummary: summary(2),
    });

    expect(plan.diff.duplicateIncomingKeys).toBe(1);
    expect(plan.diff.duplicateExistingKeys).toBe(1);
    expect(plan.diff.duplicateIncomingIdentityHashes).toBe(1);
    expect(plan.diff.duplicateExistingIdentityHashes).toBe(1);
    expect(plan.diagnostics.incomingIdentity).toMatchObject({
      duplicateKeyCount: 1,
      duplicateRowCount: 2,
      maxDuplicateGroupSize: 2,
      groupsWithSameContentHash: 1,
      groupsWithMixedContentHash: 0,
    });
    expect(plan.planReady).toBe(false);
    expect(plan.blockedReasons).toContain("DUPLICATE_INCOMING_SYNC_KEYS");
    expect(plan.blockedReasons).toContain("DUPLICATE_EXISTING_SYNC_KEYS");
    expect(plan.safety.dbWriteExecuted).toBe(false);
  });

  it("does not block when natural keys repeat but identity hashes are distinct", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [
        syncRow("identity-a", "hash-a", { naturalKey: "natural-a", occurrenceIndexWithinNaturalKey: 1 }),
        syncRow("identity-b", "hash-b", { naturalKey: "natural-a", occurrenceIndexWithinNaturalKey: 2 }),
      ],
      existingRows: [],
      incomingSummary: summary(2),
      readOnlyEvidence: {
        readExecuted: true,
        readBlockedReason: null,
      },
    });

    expect(plan.diff.duplicateIncomingKeys).toBe(0);
    expect(plan.diagnostics.incomingNaturalKey.duplicateKeyCount).toBe(1);
    expect(plan.diagnostics.incomingNaturalKey.maxDuplicateGroupSize).toBe(2);
    expect(plan.planReady).toBe(true);
  });

  it("blocks readiness when warning or error rows are present", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [syncRow("key-a", "hash-a")],
      existingRows: [],
      incomingSummary: {
        normalRows: 1,
        excludedRows: 0,
        warningRows: 1,
        errorRows: 1,
      },
      readOnlyEvidence: {
        readExecuted: true,
        readBlockedReason: null,
      },
    });

    expect(plan.planReady).toBe(false);
    expect(plan.blockedReasons).toContain("HAS_WARNING_ROWS");
    expect(plan.blockedReasons).toContain("HAS_ERROR_ROWS");
  });

  it("summarizes duplicate groups without exposing row-level data", () => {
    expect(summarizeDuplicateSyncKeys([
      syncRow("key-a", "hash-a"),
      syncRow("key-a", "hash-a"),
      syncRow("key-b", "hash-b"),
      syncRow("key-b", "hash-c"),
      syncRow("key-b", "hash-d"),
      syncRow("key-c", "hash-c"),
    ])).toEqual({
      duplicateKeyCount: 2,
      duplicateRowCount: 5,
      maxDuplicateGroupSize: 3,
      groupsWithSameContentHash: 1,
      groupsWithMixedContentHash: 1,
    });
  });

  it("blocks the plan when read-only existing row evidence is unavailable", () => {
    const plan = planLedgerSyncDiff({
      scope,
      incomingRows: [syncRow("key-a", "hash-a")],
      existingRows: [],
      incomingSummary: summary(1),
      readOnlyEvidence: {
        readExecuted: false,
        readBlockedReason: "SYNC_DIFF_DB_READ_FAILED",
      },
    });

    expect(plan.planReady).toBe(false);
    expect(plan.blockedReasons).toContain("SYNC_DIFF_DB_READ_FAILED");
  });
});

function syncRow(syncKey: string, syncContentHash: string, overrides: Partial<LedgerSyncRow> = {}): LedgerSyncRow {
  return {
    syncKey,
    syncContentHash,
    naturalKey: overrides.naturalKey ?? syncKey,
    occurrenceIndexWithinNaturalKey: overrides.occurrenceIndexWithinNaturalKey ?? 1,
    identityHash: syncKey,
    contentHash: syncContentHash,
    keyVersion: "natural_occurrence_v2",
    partCode: "11",
    ledgerDate: "2026-06-03",
    rowType: "item_detail",
    rowIndex: 1,
    ...overrides,
  };
}

function numberedSyncRows(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(4, "0");
    return syncRow(`key-${number}`, `hash-${number}`, { rowIndex: index + 1 });
  });
}

function summary(normalRows: number) {
  return {
    normalRows,
    excludedRows: 0,
    warningRows: 0,
    errorRows: 0,
  };
}
