import { describe, expect, it } from "vitest";
import {
  adminStatusDashboardMockViewModel,
  createAdminStatusDashboardViewModel,
  type AdminStatusDashboardContract,
} from "@/lib/admin/admin-status-dashboard-contract";

describe("admin status dashboard aggregate contract", () => {
  it("creates an aggregate-only all-part admin status view model", () => {
    expect(adminStatusDashboardMockViewModel).toMatchObject({
      adminAllPartAccess: true,
      partCount: 2,
      amountTotal: 340000,
      approvalRequiredParts: ["1"],
      rawRowsReturned: false,
      planReady: true,
      safety: {
        dbWrite: false,
        sync: false,
        apply: false,
        rawRowsReturned: false,
        piiReturned: false,
      },
    });
    expect(adminStatusDashboardMockViewModel.candidateTotals).toMatchObject({
      insertCandidates: 5,
      updateCandidates: 1,
      removedFromCurrentCandidates: 0,
      noChangeRows: 30,
      amountDelta: 3000,
    });
    expect(adminStatusDashboardMockViewModel.receivableTotals).toMatchObject({
      outstandingAmount: 1290000,
      highRiskGroups: 2,
      actionRequiredCount: 3,
    });
  });

  it("marks the plan unready when a part returns rows", () => {
    const contract: AdminStatusDashboardContract = {
      ...adminStatusDashboardMockViewModel,
      parts: [
        {
          ...adminStatusDashboardMockViewModel.parts[0],
          rawRowsReturned: true as false,
        },
      ],
    };

    expect(createAdminStatusDashboardViewModel(contract).planReady).toBe(false);
  });

  it("keeps per-part summaries aggregate-only", () => {
    expect(adminStatusDashboardMockViewModel.parts.every((part) => part.rawRowsReturned === false)).toBe(true);
    expect(adminStatusDashboardMockViewModel.adminAllPartAccess).toBe(true);
  });
});
