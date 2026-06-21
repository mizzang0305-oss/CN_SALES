import { describe, expect, it } from "vitest";
import {
  createMonthlyImportReportViewModel,
  monthlyImportReportMockViewModel,
  type MonthlyImportReportContract,
} from "@/lib/reports/monthly-import-report-contract";

describe("monthly import report aggregate contract", () => {
  it("creates an aggregate-only monthly report view model", () => {
    expect(monthlyImportReportMockViewModel).toMatchObject({
      part: "4",
      month: "2026-06",
      normalRows: 20,
      excludedRows: 3,
      amountTotal: 48000,
      weeklyCount: 2,
      weeklyAmountTotal: 48000,
      carryOverAmountTotal: 12000,
      changeTotal: 20,
      planReady: true,
      rawRowsReturned: false,
      safety: {
        dbWrite: false,
        sync: false,
        apply: false,
        rawRowsReturned: false,
      },
    });
  });

  it("marks the plan unready when weekly totals drift from the month", () => {
    const contract: MonthlyImportReportContract = {
      ...monthlyImportReportMockViewModel,
      amountTotal: 49000,
    };

    expect(createMonthlyImportReportViewModel(contract).planReady).toBe(false);
  });

  it("keeps weekly breakdown and carry-over items aggregate-only", () => {
    expect(monthlyImportReportMockViewModel.weeklyBreakdown.every((week) => week.rawRowsReturned === false)).toBe(true);
    expect(monthlyImportReportMockViewModel.carryOverItems.every((item) => item.rawRowsReturned === false)).toBe(true);
  });
});
