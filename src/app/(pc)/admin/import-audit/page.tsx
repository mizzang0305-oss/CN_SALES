import { AppShell, PageHeader } from "@/components/app/app-shell";
import { AdminImportAuditReadiness } from "@/components/web-import/admin-import-audit-readiness";

export default function AdminImportAuditPage() {
  return (
    <AppShell activePath="/admin/import-audit">
      <PageHeader title="Import audit readiness" description="Admin review surface for ERP XLS upload status before approved sync execution." />
      <AdminImportAuditReadiness />
    </AppShell>
  );
}
