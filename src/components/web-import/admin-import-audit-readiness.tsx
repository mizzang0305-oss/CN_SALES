import { ClipboardCheck, FileSpreadsheet, LockKeyhole, ShieldCheck } from "lucide-react";
import { supportedSalesPartCodes } from "@/lib/auth/part-access";

const auditRows = supportedSalesPartCodes.map((part) => ({
  part,
  uploadStatus: "waiting for upload",
  closeStatus: "not sealed",
  approvalStatus: "approval required",
}));

export function AdminImportAuditReadiness() {
  return (
    <div className="space-y-5" data-admin-import-audit-readiness="empty-state">
      <section className="grid gap-3 md:grid-cols-3">
        <ReadinessCard
          icon={<FileSpreadsheet className="size-5" />}
          title="Upload history"
          value="Empty"
          detail="No live DB query is connected in W-9."
        />
        <ReadinessCard
          icon={<ShieldCheck className="size-5" />}
          title="Admin scope"
          value="All supported parts"
          detail="ADMIN may preview and dry-run parts 1, 4, 5, 6, 7, 9, 10, and 11."
        />
        <ReadinessCard
          icon={<LockKeyhole className="size-5" />}
          title="Sync execution"
          value="Disabled"
          detail="Schema and execution approval are still required."
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[17px] font-semibold text-slate-950">
          <ClipboardCheck className="size-5" />
          Part upload status
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">Part</th>
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">Upload</th>
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">Close</th>
                <th className="border-b border-slate-200 px-3 py-2 font-semibold">Approval</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((row) => (
                <tr key={row.part} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-semibold text-slate-950">Part {row.part}</td>
                  <td className="px-3 py-2 text-slate-600">{row.uploadStatus}</td>
                  <td className="px-3 py-2 text-slate-600">{row.closeStatus}</td>
                  <td className="px-3 py-2 text-slate-600">{row.approvalStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <InfoBlock
          title="Approval boundary"
          lines={[
            "schemaApproval: WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED required",
            "executionApproval: WEB_ERP_XLS_SYNC_EXECUTE_APPROVED required",
            "syncEnabled: false",
            "applyEnabled: false",
            "rollbackEnabled: false",
          ]}
        />
        <InfoBlock
          title="Safety"
          lines={[
            "dbWrite: false",
            "storageWrite: false",
            "productionPost: false",
            "rawRowsReturned: false",
            "physicalDelete: false",
          ]}
        />
      </section>
    </div>
  );
}

function ReadinessCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-600">{icon}</div>
      <div className="mt-3 text-[14px] font-medium text-slate-500">{title}</div>
      <div className="mt-1 text-xl font-semibold text-slate-950">{value}</div>
      <p className="mt-2 text-[14px] leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-[16px] font-semibold text-slate-950">{title}</div>
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
