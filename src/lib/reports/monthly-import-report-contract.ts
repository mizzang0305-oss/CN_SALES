export type MonthlyImportChangeSummary = {
  insertCandidates: number;
  updateCandidates: number;
  removedFromCurrentCandidates: number;
  noChangeRows: number;
  amountDelta: number;
};

export type MonthlyImportWeeklyBreakdown = MonthlyImportChangeSummary & {
  weekStart: string;
  weekEnd: string;
  normalRows: number;
  amountTotal: number;
  rawRowsReturned: false;
};

export type MonthlyImportCarryOverItem = {
  carryOverKey: string;
  part: string;
  amount: number;
  status: "planned" | "watch" | "follow_up";
  memo: string;
  rawRowsReturned: false;
};

export type MonthlyImportReportContract = {
  part: string;
  month: string;
  normalRows: number;
  excludedRows: number;
  amountTotal: number;
  changeSummary: MonthlyImportChangeSummary;
  weeklyBreakdown: MonthlyImportWeeklyBreakdown[];
  carryOverItems: MonthlyImportCarryOverItem[];
  rawRowsReturned: false;
};

export type MonthlyImportReportViewModel = MonthlyImportReportContract & {
  weeklyCount: number;
  weeklyAmountTotal: number;
  changeTotal: number;
  carryOverAmountTotal: number;
  planReady: boolean;
  safety: {
    dbWrite: false;
    sync: false;
    apply: false;
    rawRowsReturned: false;
  };
};

export function createMonthlyImportReportViewModel(input: MonthlyImportReportContract): MonthlyImportReportViewModel {
  const weeklyAmountTotal = input.weeklyBreakdown.reduce((sum, week) => sum + week.amountTotal, 0);
  const carryOverAmountTotal = input.carryOverItems.reduce((sum, item) => sum + item.amount, 0);
  const changeTotal =
    input.changeSummary.insertCandidates +
    input.changeSummary.updateCandidates +
    input.changeSummary.removedFromCurrentCandidates +
    input.changeSummary.noChangeRows;
  const weeklyNormalRows = input.weeklyBreakdown.reduce((sum, week) => sum + week.normalRows, 0);

  return {
    ...input,
    weeklyCount: input.weeklyBreakdown.length,
    weeklyAmountTotal,
    changeTotal,
    carryOverAmountTotal,
    planReady:
      input.rawRowsReturned === false &&
      input.normalRows === changeTotal &&
      input.normalRows === weeklyNormalRows &&
      input.amountTotal === weeklyAmountTotal &&
      input.weeklyBreakdown.every((week) => week.rawRowsReturned === false) &&
      input.carryOverItems.every((item) => item.rawRowsReturned === false),
    safety: {
      dbWrite: false,
      sync: false,
      apply: false,
      rawRowsReturned: false,
    },
  };
}

export const monthlyImportReportMockViewModel = createMonthlyImportReportViewModel({
  part: "4",
  month: "2026-06",
  normalRows: 20,
  excludedRows: 3,
  amountTotal: 48000,
  changeSummary: {
    insertCandidates: 5,
    updateCandidates: 2,
    removedFromCurrentCandidates: 1,
    noChangeRows: 12,
    amountDelta: 9000,
  },
  weeklyBreakdown: [
    {
      weekStart: "2026-06-01",
      weekEnd: "2026-06-06",
      normalRows: 10,
      amountTotal: 20000,
      insertCandidates: 2,
      updateCandidates: 1,
      removedFromCurrentCandidates: 1,
      noChangeRows: 6,
      amountDelta: 4000,
      rawRowsReturned: false,
    },
    {
      weekStart: "2026-06-07",
      weekEnd: "2026-06-12",
      normalRows: 10,
      amountTotal: 28000,
      insertCandidates: 3,
      updateCandidates: 1,
      removedFromCurrentCandidates: 0,
      noChangeRows: 6,
      amountDelta: 5000,
      rawRowsReturned: false,
    },
  ],
  carryOverItems: [
    {
      carryOverKey: "carryover:part4:2026-06:001",
      part: "4",
      amount: 12000,
      status: "watch",
      memo: "Next monthly review item.",
      rawRowsReturned: false,
    },
  ],
  rawRowsReturned: false,
});
