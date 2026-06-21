import { describe, expect, it } from "vitest";
import {
  createWeeklyImportReportViewModel,
  weeklyImportReportMockViewModel,
  type WeeklyImportReportContract,
} from "@/lib/reports/weekly-import-report-contract";

describe("weekly import report contract", () => {
  it("creates an aggregate-only weekly report view model", () => {
    expect(weeklyImportReportMockViewModel).toMatchObject({
      part: "4",
      periodLabel: "2026-06-01 ~ 2026-06-06",
      normalRows: 10,
      amountTotal: 20000,
      changeTotal: 10,
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

  it("marks the plan unready when aggregate counts do not match normalRows", () => {
    const contract: WeeklyImportReportContract = {
      ...weeklyImportReportMockViewModel,
      normalRows: 11,
    };

    expect(createWeeklyImportReportViewModel(contract).planReady).toBe(false);
  });

  it("includes planned receivable, carry-over, and monthly memo fields without row payloads", () => {
    expect(weeklyImportReportMockViewModel.receivablePlan.expectedFields).toEqual([
      "customerScopeKey",
      "receivableBalance",
      "collectionMemo",
    ]);
    expect(weeklyImportReportMockViewModel.carryOverPlan.expectedFields).toEqual([
      "previousWeekOpenItems",
      "nextWeekFollowUps",
    ]);
    expect(weeklyImportReportMockViewModel.monthlyMemoPlan.expectedFields).toEqual([
      "monthToDateAmount",
      "monthlyAccumulationMemo",
    ]);
    expect(weeklyImportReportMockViewModel.rawRowsReturned).toBe(false);
  });
});
