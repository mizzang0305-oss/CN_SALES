import { describe, expect, it } from "vitest";
import { normalizeLedgerDate } from "@/lib/import/ledger-date-normalization";

const juneScope = {
  periodStart: "2026-06-01",
  periodEnd: "2026-06-06",
};

describe("ledger date normalization", () => {
  it("normalizes parseable date strings to canonical YYYY-MM-DD", () => {
    expect(normalizeLedgerDate("2026.6.1", juneScope)).toMatchObject({
      ok: true,
      isoDate: "2026-06-01",
      formatCategory: "yyyy.m.d",
      changedToIso: true,
    });
    expect(normalizeLedgerDate("2026/06/02", juneScope)).toMatchObject({
      ok: true,
      isoDate: "2026-06-02",
      formatCategory: "yyyy/mm/dd",
      changedToIso: true,
    });
    expect(normalizeLedgerDate("2026년 6월 3일", juneScope)).toMatchObject({
      ok: true,
      isoDate: "2026-06-03",
      formatCategory: "korean-date",
      changedToIso: true,
    });
    expect(normalizeLedgerDate("2026-06-04T00:00:00", juneScope)).toMatchObject({
      ok: true,
      isoDate: "2026-06-04",
      formatCategory: "datetime",
      changedToIso: true,
    });
  });

  it("normalizes scoped Korean day-only markers when the approval period is within one month", () => {
    expect(normalizeLedgerDate("【 01일 】", juneScope)).toMatchObject({
      ok: true,
      isoDate: "2026-06-01",
      formatCategory: "korean-date",
      changedToIso: true,
    });

    expect(normalizeLedgerDate("【 01일 】", {
      periodStart: "2026-05-31",
      periodEnd: "2026-06-01",
    })).toMatchObject({
      ok: false,
      reason: "invalid",
      isoDate: null,
      formatCategory: "korean-date",
    });
  });

  it("preserves valid canonical ISO dates", () => {
    expect(normalizeLedgerDate("2026-06-05", juneScope)).toMatchObject({
      ok: true,
      isoDate: "2026-06-05",
      formatCategory: "yyyy-mm-dd",
      changedToIso: false,
    });
  });

  it("normalizes Excel serial dates when the parser exposes a number", () => {
    expect(normalizeLedgerDate(46174, juneScope)).toMatchObject({
      ok: true,
      isoDate: "2026-06-01",
      formatCategory: "excel-serial",
      changedToIso: true,
    });
  });

  it("blocks missing, invalid, and out-of-scope dates", () => {
    expect(normalizeLedgerDate("", juneScope)).toMatchObject({
      ok: false,
      reason: "missing",
      isoDate: null,
      formatCategory: "unknown",
    });
    expect(normalizeLedgerDate("2026-02-31", juneScope)).toMatchObject({
      ok: false,
      reason: "invalid",
      isoDate: null,
      formatCategory: "yyyy-mm-dd",
    });
    expect(normalizeLedgerDate("2026-06-07", juneScope)).toMatchObject({
      ok: false,
      reason: "out-of-scope",
      isoDate: null,
      formatCategory: "yyyy-mm-dd",
    });
  });
});
