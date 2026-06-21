import { AppShell, PageHeader } from "@/components/app/app-shell";
import { WeeklyReportReadiness } from "@/components/reports/reporting-dashboard-readiness";

export default function WeeklyReportPage() {
  return (
    <AppShell activePath="/reports">
      <PageHeader title="Weekly report readiness" description="Aggregate-only ERP XLS weekly report shell using mock readiness data." />
      <WeeklyReportReadiness />
    </AppShell>
  );
}
