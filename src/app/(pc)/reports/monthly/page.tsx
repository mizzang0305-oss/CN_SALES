import { AppShell, PageHeader } from "@/components/app/app-shell";
import { MonthlyReportReadiness } from "@/components/reports/reporting-dashboard-readiness";

export default function MonthlyReportPage() {
  return (
    <AppShell activePath="/reports">
      <PageHeader title="Monthly report readiness" description="Aggregate-only ERP XLS monthly rollup shell using mock readiness data." />
      <MonthlyReportReadiness />
    </AppShell>
  );
}
