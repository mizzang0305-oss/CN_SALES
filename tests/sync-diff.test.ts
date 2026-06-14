import { describe, expect, it } from "vitest";
import { deriveLedgerSyncScope, planLedgerSyncDiff, summarizeDuplicateSyncKeys } from "@/lib/import/sync-diff";
import type { LedgerSyncRow } from "@/lib/import/sync-key";

const scope = {
  partCode: "11",
  dateFrom: "2026-06-01",
  dateTo: "2026-06-06",
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

function summary(normalRows: number) {
  return {
    normalRows,
    excludedRows: 0,
    warningRows: 0,
    errorRows: 0,
  };
}
