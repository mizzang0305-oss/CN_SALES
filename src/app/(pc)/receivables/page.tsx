import { AppShell, PageHeader } from "@/components/app/app-shell";
import { ReceivableDashboardReadiness } from "@/components/reports/reporting-dashboard-readiness";

export default function ReceivablesPage() {
  return (
    <AppShell activePath="/ar">
      <PageHeader title="Receivable dashboard readiness" description="Masked aggregate AR shell with no raw customer payloads." />
      <ReceivableDashboardReadiness />
    </AppShell>
  );
}
