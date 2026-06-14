import { describe, expect, it } from "vitest";
import { deriveLedgerSyncScope, planLedgerSyncDiff } from "@/lib/import/sync-diff";
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
    expect(plan.planReady).toBe(false);
    expect(plan.blockedReasons).toContain("DUPLICATE_INCOMING_SYNC_KEYS");
    expect(plan.blockedReasons).toContain("DUPLICATE_EXISTING_SYNC_KEYS");
    expect(plan.safety.dbWriteExecuted).toBe(false);
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

function syncRow(syncKey: string, syncContentHash: string): LedgerSyncRow {
  return {
    syncKey,
    syncContentHash,
    partCode: "11",
    ledgerDate: "2026-06-03",
    rowType: "item_detail",
    rowIndex: 1,
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
