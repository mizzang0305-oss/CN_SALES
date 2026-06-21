import { CalendarDays, ClipboardCheck, FileText, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { adminStatusDashboardMockViewModel } from "@/lib/admin/admin-status-dashboard-contract";
import { receivableDashboardMockViewModel } from "@/lib/receivables/receivable-dashboard-contract";
import { monthlyImportReportMockViewModel } from "@/lib/reports/monthly-import-report-contract";
import { weeklyImportReportMockViewModel } from "@/lib/reports/weekly-import-report-contract";
import { formatNumber, formatWon } from "@/lib/format";

export function WeeklyReportReadiness() {
  const report = weeklyImportReportMockViewModel;

  return (
    <DashboardSurface
      dataId="weekly-report-readiness"
      title="Weekly report readiness"
      description="Aggregate ERP XLS import summary for the weekly report shell."
      icon={<FileText className="size-5" />}
      metrics={[
        ["Part", `Part ${report.part}`],
        ["Period", report.periodLabel],
        ["Amount total", formatWon(report.amountTotal)],
        ["Normal rows", formatNumber(report.normalRows)],
        ["Plan ready", String(report.planReady)],
        ["rawRowsReturned", String(report.rawRowsReturned)],
      ]}
      sections={[
        {
          title: "Candidate summary",
          lines: [
            `insert: ${formatNumber(report.changeSummary.insertCandidates)}`,
            `update: ${formatNumber(report.changeSummary.updateCandidates)}`,
            `removed: ${formatNumber(report.changeSummary.removedFromCurrentCandidates)}`,
            `noChange: ${formatNumber(report.changeSummary.noChangeRows)}`,
            `amountDelta: ${formatWon(report.changeSummary.amountDelta)}`,
          ],
        },
        {
          title: "Planned report fields",
          lines: [
            `receivable: ${report.receivablePlan.expectedFields.join(", ")}`,
            `carry-over: ${report.carryOverPlan.expectedFields.join(", ")}`,
            `monthly memo: ${report.monthlyMemoPlan.expectedFields.join(", ")}`,
          ],
        },
      ]}
    />
  );
}

export function MonthlyReportReadiness() {
  const report = monthlyImportReportMockViewModel;

  return (
    <DashboardSurface
      dataId="monthly-report-readiness"
      title="Monthly report readiness"
      description="Aggregate monthly rollup shell using mock weekly breakdowns."
      icon={<CalendarDays className="size-5" />}
      metrics={[
        ["Part", `Part ${report.part}`],
        ["Month", report.month],
        ["Amount total", formatWon(report.amountTotal)],
        ["Excluded rows", formatNumber(report.excludedRows)],
        ["Weekly rows", formatNumber(report.weeklyCount)],
        ["rawRowsReturned", String(report.rawRowsReturned)],
      ]}
      sections={[
        {
          title: "Weekly breakdown mock",
          lines: report.weeklyBreakdown.map(
            (week) => `${week.weekStart} ~ ${week.weekEnd}: ${formatWon(week.amountTotal)}, rawRowsReturned: ${String(week.rawRowsReturned)}`,
          ),
        },
        {
          title: "Carry-over items",
          lines: report.carryOverItems.map((item) => `${item.carryOverKey}: ${formatWon(item.amount)}, ${item.status}`),
        },
      ]}
    />
  );
}

export function ReceivableDashboardReadiness() {
  const dashboard = receivableDashboardMockViewModel;

  return (
    <DashboardSurface
      dataId="receivable-dashboard-readiness"
      title="Receivable dashboard readiness"
      description="Masked receivable aggregate shell for part-scoped AR review."
      icon={<WalletCards className="size-5" />}
      metrics={[
        ["Part", `Part ${dashboard.part}`],
        ["Period", `${dashboard.periodStart} ~ ${dashboard.periodEnd}`],
        ["Outstanding", formatWon(dashboard.totalOutstandingAmount)],
        ["High risk", formatNumber(dashboard.highRiskCount)],
        ["Follow-up", formatNumber(dashboard.followUpRequiredCount)],
        ["rawRowsReturned", String(dashboard.rawRowsReturned)],
      ]}
      sections={[
        {
          title: "Masked receivable groups",
          lines: dashboard.items.map(
            (item) => `${item.maskedCustomerKey}: ${formatWon(item.outstandingAmount)}, ${item.riskLevel}, ${item.actionStatus}, promise ${item.promiseDate ?? "-"}`,
          ),
        },
        {
          title: "Privacy guard",
          lines: [
            "Customer full names are not displayed.",
            "Phone and business registration numbers are not displayed.",
            "PII output is blocked.",
          ],
        },
      ]}
    />
  );
}

export function AdminSalesStatusReadiness() {
  const dashboard = adminStatusDashboardMockViewModel;

  return (
    <DashboardSurface
      dataId="admin-sales-status-readiness"
      title="Admin sales status readiness"
      description="All-part aggregate status shell for ADMIN review."
      icon={<ShieldCheck className="size-5" />}
      metrics={[
        ["Parts", formatNumber(dashboard.partCount)],
        ["Amount total", formatWon(dashboard.amountTotal)],
        ["Approval required", dashboard.approvalRequiredParts.join(", ") || "-"],
        ["Receivables", formatWon(dashboard.receivableTotals.outstandingAmount)],
        ["Plan ready", String(dashboard.planReady)],
        ["rawRowsReturned", String(dashboard.rawRowsReturned)],
      ]}
      sections={[
        {
          title: "All-part aggregate visibility",
          lines: [
            "ADMIN all-part aggregate visibility is available.",
            "SALES_REP part-scope remains assigned-part only.",
            "raw row and PII visibility remain blocked.",
          ],
        },
        {
          title: "Part statuses",
          lines: dashboard.parts.map(
            (part) =>
              `Part ${part.part}: upload ${part.uploadStatus}, sync ${part.syncStatus}, sealed ${part.sealedStatus}, amount ${formatWon(part.amountTotal)}`,
          ),
        },
      ]}
    />
  );
}

function DashboardSurface({
  dataId,
  title,
  description,
  icon,
  metrics,
  sections,
}: {
  dataId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  metrics: Array<[string, string]>;
  sections: Array<{ title: string; lines: string[] }>;
}) {
  return (
    <div className="space-y-5" data-reporting-dashboard-readiness={dataId}>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-slate-900 text-white">{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="text-[15px] leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(([label, value]) => (
            <Metric key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {sections.map((section) => (
          <InfoPanel key={section.title} title={section.title} lines={section.lines} />
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[16px] font-semibold text-slate-950">
          <LockKeyhole className="size-5" />
          Execution boundary
        </div>
        <div className="mt-3 grid gap-2 text-[14px] leading-6 text-slate-600 sm:grid-cols-2">
          <div>DB write: false</div>
          <div>sync/apply: false</div>
          <div>productionPost: false</div>
          <div>rawRowsReturned: false</div>
          <div>enabled sync button: false</div>
          <div>mockDataOnly: true</div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 break-words text-[18px] font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function InfoPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[16px] font-semibold text-slate-950">
        <ClipboardCheck className="size-5" />
        {title}
      </div>
      <ul className="mt-3 space-y-1 text-[14px] leading-6 text-slate-600">
        {lines.map((line) => (
          <li key={line} className="break-all">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
