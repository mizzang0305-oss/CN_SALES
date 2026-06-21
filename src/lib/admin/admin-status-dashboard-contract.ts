export type AdminPartUploadStatus = "not_started" | "preview_ready" | "dry_run_ready" | "sync_blocked" | "sealed";

export type AdminPartCandidateSummary = {
  insertCandidates: number;
  updateCandidates: number;
  removedFromCurrentCandidates: number;
  noChangeRows: number;
  amountDelta: number;
};

export type AdminPartReceivableSummary = {
  outstandingAmount: number;
  highRiskGroups: number;
  actionRequiredCount: number;
};

export type AdminPartReportReadiness = {
  weekly: "ready" | "planned" | "blocked";
  monthly: "ready" | "planned" | "blocked";
  receivable: "ready" | "planned" | "blocked";
};

export type AdminStatusPartContract = {
  part: string;
  periodStart: string;
  periodEnd: string;
  uploadStatus: AdminPartUploadStatus;
  syncStatus: "disabled" | "approval_required" | "synced";
  sealedStatus: "not_sealed" | "sealed";
  amountTotal: number;
  candidateSummary: AdminPartCandidateSummary;
  receivableSummary: AdminPartReceivableSummary;
  reportReadiness: AdminPartReportReadiness;
  rawRowsReturned: false;
};

export type AdminStatusDashboardContract = {
  parts: AdminStatusPartContract[];
  adminAllPartAccess: true;
  rawRowsReturned: false;
};

export type AdminStatusDashboardViewModel = AdminStatusDashboardContract & {
  partCount: number;
  amountTotal: number;
  candidateTotals: AdminPartCandidateSummary;
  receivableTotals: AdminPartReceivableSummary;
  approvalRequiredParts: string[];
  planReady: boolean;
  safety: {
    dbWrite: false;
    sync: false;
    apply: false;
    rawRowsReturned: false;
    piiReturned: false;
  };
};

export function createAdminStatusDashboardViewModel(input: AdminStatusDashboardContract): AdminStatusDashboardViewModel {
  const candidateTotals = input.parts.reduce<AdminPartCandidateSummary>(
    (totals, part) => ({
      insertCandidates: totals.insertCandidates + part.candidateSummary.insertCandidates,
      updateCandidates: totals.updateCandidates + part.candidateSummary.updateCandidates,
      removedFromCurrentCandidates: totals.removedFromCurrentCandidates + part.candidateSummary.removedFromCurrentCandidates,
      noChangeRows: totals.noChangeRows + part.candidateSummary.noChangeRows,
      amountDelta: totals.amountDelta + part.candidateSummary.amountDelta,
    }),
    { insertCandidates: 0, updateCandidates: 0, removedFromCurrentCandidates: 0, noChangeRows: 0, amountDelta: 0 },
  );
  const receivableTotals = input.parts.reduce<AdminPartReceivableSummary>(
    (totals, part) => ({
      outstandingAmount: totals.outstandingAmount + part.receivableSummary.outstandingAmount,
      highRiskGroups: totals.highRiskGroups + part.receivableSummary.highRiskGroups,
      actionRequiredCount: totals.actionRequiredCount + part.receivableSummary.actionRequiredCount,
    }),
    { outstandingAmount: 0, highRiskGroups: 0, actionRequiredCount: 0 },
  );
  const approvalRequiredParts = input.parts
    .filter((part) => part.syncStatus === "approval_required" || part.syncStatus === "disabled")
    .map((part) => part.part);

  return {
    ...input,
    partCount: input.parts.length,
    amountTotal: input.parts.reduce((sum, part) => sum + part.amountTotal, 0),
    candidateTotals,
    receivableTotals,
    approvalRequiredParts,
    planReady: input.adminAllPartAccess === true && input.rawRowsReturned === false && input.parts.every((part) => part.rawRowsReturned === false),
    safety: {
      dbWrite: false,
      sync: false,
      apply: false,
      rawRowsReturned: false,
      piiReturned: false,
    },
  };
}

export const adminStatusDashboardMockViewModel = createAdminStatusDashboardViewModel({
  adminAllPartAccess: true,
  rawRowsReturned: false,
  parts: [
    {
      part: "1",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      uploadStatus: "dry_run_ready",
      syncStatus: "approval_required",
      sealedStatus: "not_sealed",
      amountTotal: 120000,
      candidateSummary: {
        insertCandidates: 5,
        updateCandidates: 1,
        removedFromCurrentCandidates: 0,
        noChangeRows: 10,
        amountDelta: 3000,
      },
      receivableSummary: {
        outstandingAmount: 450000,
        highRiskGroups: 1,
        actionRequiredCount: 2,
      },
      reportReadiness: {
        weekly: "planned",
        monthly: "planned",
        receivable: "planned",
      },
      rawRowsReturned: false,
    },
    {
      part: "4",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      uploadStatus: "sealed",
      syncStatus: "synced",
      sealedStatus: "sealed",
      amountTotal: 220000,
      candidateSummary: {
        insertCandidates: 0,
        updateCandidates: 0,
        removedFromCurrentCandidates: 0,
        noChangeRows: 20,
        amountDelta: 0,
      },
      receivableSummary: {
        outstandingAmount: 840000,
        highRiskGroups: 1,
        actionRequiredCount: 1,
      },
      reportReadiness: {
        weekly: "ready",
        monthly: "planned",
        receivable: "planned",
      },
      rawRowsReturned: false,
    },
  ],
});
