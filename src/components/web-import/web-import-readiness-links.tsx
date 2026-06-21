import Link from "next/link";
import { ClipboardList, FileSpreadsheet, ShieldCheck, WalletCards } from "lucide-react";

const readinessLinks = [
  {
    href: "/part/import-sales",
    label: "Preview readiness",
    description: "ERP XLS preview and dry-run readiness surface.",
    icon: FileSpreadsheet,
  },
  {
    href: "/admin/import-audit",
    label: "Import audit readiness",
    description: "Admin upload status and approval review shell.",
    icon: ClipboardList,
  },
  {
    href: "/reports/weekly",
    label: "Weekly report readiness",
    description: "Aggregate weekly report contract view.",
    icon: ClipboardList,
  },
  {
    href: "/reports/monthly",
    label: "Monthly report readiness",
    description: "Aggregate monthly report contract view.",
    icon: ClipboardList,
  },
  {
    href: "/receivables",
    label: "Receivable readiness",
    description: "Masked aggregate receivable dashboard shell.",
    icon: WalletCards,
  },
  {
    href: "/admin/sales-status",
    label: "Admin status readiness",
    description: "All-part aggregate admin status shell.",
    icon: ShieldCheck,
  },
];

export function WebImportReadinessLinks() {
  return (
    <section className="mt-5 space-y-3" data-web-import-readiness-links="read-only">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Readiness route links</h2>
        <p className="mt-1 text-[15px] leading-6 text-slate-600">
          Read-only navigation for the local follow-up package. readOnlyLinks: true, syncEnabled: false, rawRowsReturned=false.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {readinessLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-slate-900 text-white">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-slate-950">{item.label}</div>
                  <div className="text-[13px] text-slate-500">{item.href}</div>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-slate-600">{item.description}</p>
            </Link>
          );
        })}
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[14px] leading-6 text-slate-600">
        <div>DB write: false</div>
        <div>sync/apply: false</div>
        <div>approval required before schema or sync work</div>
      </div>
    </section>
  );
}
