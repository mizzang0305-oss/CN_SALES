export type ReceivableRiskLevel = "low" | "medium" | "high";

export type ReceivableActionStatus = "watch" | "follow_up_required" | "promise_recorded" | "review_ready";

export type ReceivableDashboardItem = {
  part: string;
  maskedCustomerKey: string;
  outstandingAmount: number;
  lastPaymentDate: string | null;
  promiseDate: string | null;
  riskLevel: ReceivableRiskLevel;
  actionStatus: ReceivableActionStatus;
  rawRowsReturned: false;
};

export type ReceivableDashboardContract = {
  part: string;
  periodStart: string;
  periodEnd: string;
  items: ReceivableDashboardItem[];
  rawRowsReturned: false;
};

export type ReceivableDashboardViewModel = ReceivableDashboardContract & {
  itemCount: number;
  totalOutstandingAmount: number;
  highRiskCount: number;
  followUpRequiredCount: number;
  planReady: boolean;
  safety: {
    dbWrite: false;
    sync: false;
    apply: false;
    rawRowsReturned: false;
    piiReturned: false;
  };
};

export function createReceivableDashboardViewModel(input: ReceivableDashboardContract): ReceivableDashboardViewModel {
  const totalOutstandingAmount = input.items.reduce((sum, item) => sum + item.outstandingAmount, 0);
  const highRiskCount = input.items.filter((item) => item.riskLevel === "high").length;
  const followUpRequiredCount = input.items.filter((item) => item.actionStatus === "follow_up_required").length;

  return {
    ...input,
    itemCount: input.items.length,
    totalOutstandingAmount,
    highRiskCount,
    followUpRequiredCount,
    planReady:
      input.rawRowsReturned === false &&
      input.items.every((item) => item.rawRowsReturned === false && item.maskedCustomerKey.startsWith("masked:")),
    safety: {
      dbWrite: false,
      sync: false,
      apply: false,
      rawRowsReturned: false,
      piiReturned: false,
    },
  };
}

export const receivableDashboardMockViewModel = createReceivableDashboardViewModel({
  part: "4",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-30",
  items: [
    {
      part: "4",
      maskedCustomerKey: "masked:part4:001",
      outstandingAmount: 300000,
      lastPaymentDate: "2026-06-12",
      promiseDate: "2026-06-25",
      riskLevel: "medium",
      actionStatus: "promise_recorded",
      rawRowsReturned: false,
    },
    {
      part: "4",
      maskedCustomerKey: "masked:part4:002",
      outstandingAmount: 540000,
      lastPaymentDate: null,
      promiseDate: null,
      riskLevel: "high",
      actionStatus: "follow_up_required",
      rawRowsReturned: false,
    },
  ],
  rawRowsReturned: false,
});
