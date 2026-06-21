import { AppShell, PageHeader } from "@/components/app/app-shell";
import { AdminSalesStatusReadiness } from "@/components/reports/reporting-dashboard-readiness";

export default function AdminSalesStatusPage() {
  return (
    <AppShell activePath="/admin/sales-status">
      <PageHeader title="Admin sales status readiness" description="All-part aggregate status shell for ADMIN review." />
      <AdminSalesStatusReadiness />
    </AppShell>
  );
}
