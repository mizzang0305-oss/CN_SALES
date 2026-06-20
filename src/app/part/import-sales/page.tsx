import { AppShell, PageHeader } from "@/components/app/app-shell";
import { SalesImportPreviewClient } from "@/components/web-import/sales-import-preview-client";

export default function PartImportSalesPage() {
  return (
    <AppShell activePath="/part/import-sales">
      <PageHeader title="Part sales import" description="Preview ERP XLS aggregates and run read-only dry-run checks." />
      <SalesImportPreviewClient />
    </AppShell>
  );
}
