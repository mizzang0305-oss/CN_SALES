export type WeeklyImportReportChangeSummary = {
  insertCandidates: number;
  updateCandidates: number;
  removedFromCurrentCandidates: number;
  noChangeRows: number;
  amountDelta: number;
};

export type WeeklyImportReportReceivablePlan = {
  receivableLinkStatus: "planned";
  expectedFields: ["customerScopeKey", "receivableBalance", "collectionMemo"];
};

export type WeeklyImportReportCarryOverPlan = {
  carryOverStatus: "planned";
  expectedFields: ["previousWeekOpenItems", "nextWeekFollowUps"];
};

export type WeeklyImportReportMonthlyMemoPlan = {
  monthlyMemoStatus: "planned";
  expectedFields: ["monthToDateAmount", "monthlyAccumulationMemo"];
};

export type WeeklyImportReportContract = {
  part: string;
  periodStart: string;
  periodEnd: string;
  normalRows: number;
  amountTotal: number;
  changeSummary: WeeklyImportReportChangeSummary;
  receivablePlan: WeeklyImportReportReceivablePlan;
  carryOverPlan: WeeklyImportReportCarryOverPlan;
  monthlyMemoPlan: WeeklyImportReportMonthlyMemoPlan;
  rawRowsReturned: false;
};

export type WeeklyImportReportViewModel = WeeklyImportReportContract & {
  periodLabel: string;
  changeTotal: number;
  planReady: boolean;
  safety: {
    dbWrite: false;
    sync: false;
    apply: false;
    rawRowsReturned: false;
  };
};

export function createWeeklyImportReportViewModel(input: WeeklyImportReportContract): WeeklyImportReportViewModel {
  const changeTotal =
    input.changeSummary.insertCandidates +
    input.changeSummary.updateCandidates +
    input.changeSummary.removedFromCurrentCandidates +
    input.changeSummary.noChangeRows;

  return {
    ...input,
    periodLabel: `${input.periodStart} ~ ${input.periodEnd}`,
    changeTotal,
    planReady: input.rawRowsReturned === false && input.normalRows === changeTotal,
    safety: {
      dbWrite: false,
      sync: false,
      apply: false,
      rawRowsReturned: false,
    },
  };
}

export const weeklyImportReportMockViewModel = createWeeklyImportReportViewModel({
  part: "4",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-06",
  normalRows: 10,
  amountTotal: 20000,
  changeSummary: {
    insertCandidates: 2,
    updateCandidates: 1,
    removedFromCurrentCandidates: 3,
    noChangeRows: 4,
    amountDelta: 8000,
  },
  receivablePlan: {
    receivableLinkStatus: "planned",
    expectedFields: ["customerScopeKey", "receivableBalance", "collectionMemo"],
  },
  carryOverPlan: {
    carryOverStatus: "planned",
    expectedFields: ["previousWeekOpenItems", "nextWeekFollowUps"],
  },
  monthlyMemoPlan: {
    monthlyMemoStatus: "planned",
    expectedFields: ["monthToDateAmount", "monthlyAccumulationMemo"],
  },
  rawRowsReturned: false,
});
