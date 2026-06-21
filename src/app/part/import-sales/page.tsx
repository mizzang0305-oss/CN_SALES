import { AppShell, PageHeader } from "@/components/app/app-shell";
import { SalesImportPreviewClient } from "@/components/web-import/sales-import-preview-client";
import { WebImportReadinessLinks } from "@/components/web-import/web-import-readiness-links";

export default function PartImportSalesPage() {
  return (
    <AppShell activePath="/part/import-sales">
      <PageHeader title="Part sales import" description="Preview ERP XLS aggregates and run read-only dry-run checks." />
      <SalesImportPreviewClient />
      <WebImportReadinessLinks />
    </AppShell>
  );
}
