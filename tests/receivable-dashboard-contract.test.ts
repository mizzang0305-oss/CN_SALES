import { describe, expect, it } from "vitest";
import {
  createReceivableDashboardViewModel,
  receivableDashboardMockViewModel,
  type ReceivableDashboardContract,
} from "@/lib/receivables/receivable-dashboard-contract";

describe("receivable dashboard aggregate contract", () => {
  it("creates an aggregate-only receivable dashboard view model", () => {
    expect(receivableDashboardMockViewModel).toMatchObject({
      part: "4",
      itemCount: 2,
      totalOutstandingAmount: 840000,
      highRiskCount: 1,
      followUpRequiredCount: 1,
      planReady: true,
      rawRowsReturned: false,
      safety: {
        dbWrite: false,
        sync: false,
        apply: false,
        rawRowsReturned: false,
        piiReturned: false,
      },
    });
  });

  it("marks the plan unready when a customer key is not masked", () => {
    const contract: ReceivableDashboardContract = {
      ...receivableDashboardMockViewModel,
      items: [
        {
          ...receivableDashboardMockViewModel.items[0],
          maskedCustomerKey: "plain-key",
        },
      ],
    };

    expect(createReceivableDashboardViewModel(contract).planReady).toBe(false);
  });

  it("keeps item payloads aggregate and masked", () => {
    expect(receivableDashboardMockViewModel.items.every((item) => item.rawRowsReturned === false)).toBe(true);
    expect(receivableDashboardMockViewModel.items.every((item) => item.maskedCustomerKey.startsWith("masked:"))).toBe(true);
  });
});
