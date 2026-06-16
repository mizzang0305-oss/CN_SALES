import { describe, expect, it } from "vitest";
import { verifyLimitedApplyReadBack } from "@/lib/import/readback-verification";

describe("limited apply read-back verification", () => {
  it.each([3, 30, 100, 500])("passes for %i selected-column read-back rows", (rowCount) => {
    const result = verifyLimitedApplyReadBack({
      requestedRows: rowCount,
      readBackRows: rows(rowCount),
      expectedIdentityHashes: Array.from({ length: rowCount }, (_, index) => `identity-${index + 1}`),
      expectedPartId: "part-11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      auditStatusPresent: true,
    });

    expect(result).toMatchObject({
      ok: true,
      readBackRows: rowCount,
      identityHashCount: rowCount,
      matchesRequestedRows: true,
      identityHashMatch: true,
      partDateMatch: true,
      contentHashPresent: true,
      selectedColumnsOnly: true,
      selectStarUsed: false,
      normalizedTableWriteRequired: false,
      blockedReasons: [],
    });
  });

  it("fails if the read-back row count does not match the requested rows", () => {
    const result = verifyLimitedApplyReadBack({
      requestedRows: 3,
      readBackRows: rows(2),
      expectedIdentityHashes: ["identity-1", "identity-2", "identity-3"],
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("READBACK_ROW_COUNT_MISMATCH");
  });

  it("fails if an expected identity hash is missing", () => {
    const result = verifyLimitedApplyReadBack({
      requestedRows: 3,
      readBackRows: rows(3),
      expectedIdentityHashes: ["identity-1", "identity-2", "identity-missing"],
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("READBACK_IDENTITY_HASH_MISMATCH");
  });

  it("fails if the read-back part/date scope does not match", () => {
    const result = verifyLimitedApplyReadBack({
      requestedRows: 3,
      readBackRows: [row(1), row(2, { partId: "part-99" }), row(3)],
      expectedIdentityHashes: ["identity-1", "identity-2", "identity-3"],
      expectedPartId: "part-11",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
    });

    expect(result.ok).toBe(false);
    expect(result.blockedReasons).toContain("READBACK_PART_DATE_MISMATCH");
  });

  it("does not require normalized table read-back for limited insert-only apply", () => {
    const result = verifyLimitedApplyReadBack({
      requestedRows: 3,
      readBackRows: rows(3),
      expectedIdentityHashes: ["identity-1", "identity-2", "identity-3"],
      normalizedTableWrite: false,
    });

    expect(result.ok).toBe(true);
    expect(result.normalizedTableWriteRequired).toBe(false);
  });
});

function rows(count: number) {
  return Array.from({ length: count }, (_, index) => row(index + 1));
}

function row(index: number, overrides: { partId?: string; ledgerDate?: string } = {}) {
  return {
    id: `row-${index}`,
    upload_id: "upload-1",
    part_id: overrides.partId ?? "part-11",
    row_index: index,
    ledger_date: overrides.ledgerDate ?? "2026-06-02",
    row_type: "item_detail",
    identity_hash: `identity-${index}`,
    content_hash: `content-${index}`,
  };
}
