"use client";

import { useState } from "react";
import { AlertCircle, FileSpreadsheet, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber, formatWon } from "@/lib/format";
import { salesImportRoles, supportedSalesPartCodes } from "@/lib/auth/part-access";

type PreviewResponse = {
  ok: true;
  fileName: string;
  fileHash: string;
  part: string;
  selectedPart: string;
  filePart: string | null;
  periodStart: string;
  periodEnd: string;
  normalRows: number;
  excludedRows: number;
  amountTotal: number;
  warningRows: number;
  errorRows: number;
  rawRowsReturned: false;
  permission: {
    role: string;
    allowedParts: string[];
    crossPartBlocked: false;
  };
  sideEffects: {
    dbWrite: false;
    storageWrite: false;
    sync: false;
    apply: false;
  };
  blockedReasons: string[];
  warnings: string[];
};

type PreviewError = {
  ok: false;
  error?: { code?: string; message?: string };
  blockedReasons?: string[];
  allowedParts?: string[];
  rawRowsReturned?: false;
};

type DryRunResponse = {
  ok: true;
  part: string;
  periodStart: string;
  periodEnd: string;
  fileHash: string;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  removedFromCurrentCandidates: number;
  noChangeRows: number;
  amountBefore: number;
  amountAfter: number;
  amountDelta: number;
  blockedRows: number;
  planReady: boolean;
  rawRowsReturned: false;
  blockedReasons: string[];
  permission: {
    role: string;
    allowedParts: string[];
    crossPartBlocked: false;
  };
  sideEffects: {
    dbWrite: false;
    storageWrite: false;
    sync: false;
    apply: false;
    physicalDelete: false;
  };
};

type DryRunError = {
  ok: false;
  error?: { code?: string; message?: string };
  blockedReasons?: string[];
  rawRowsReturned?: false;
};

const roles = [...salesImportRoles];
const parts = ["", ...supportedSalesPartCodes];

export function SalesImportPreviewClient() {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("SALES_REP_PART_1");
  const [managedParts, setManagedParts] = useState("1,4");
  const [partCode, setPartCode] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodMonth, setPeriodMonth] = useState("2026-06");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [dryRun, setDryRun] = useState<DryRunResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);

  async function submitPreview() {
    if (!file) {
      setError("UPLOAD_FILE_REQUIRED");
      setPreview(null);
      setDryRun(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setPreview(null);
    setDryRun(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("role", role);
      formData.set("managedParts", managedParts);
      formData.set("partCode", partCode);
      formData.set("periodMonth", periodMonth);
      formData.set("periodStart", periodStart);
      formData.set("periodEnd", periodEnd);

      const response = await fetch("/api/sales-import/preview", { method: "POST", body: formData });
      const body = (await response.json()) as PreviewResponse | PreviewError;
      if (!response.ok || body.ok !== true) {
        const errorBody = body as PreviewError;
        const blocked = errorBody.blockedReasons?.length ? ` ${errorBody.blockedReasons.join(", ")}` : "";
        throw new Error(`${errorBody.error?.code ?? "PREVIEW_BLOCKED"}${blocked}`);
      }
      setPreview(body);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "PREVIEW_BLOCKED");
    } finally {
      setIsLoading(false);
    }
  }

  async function runDryRun() {
    if (!file || !preview) {
      setError("PREVIEW_REQUIRED");
      return;
    }

    setIsDryRunning(true);
    setError("");
    setDryRun(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("role", role);
      formData.set("managedParts", managedParts);
      formData.set("part", preview.part);
      formData.set("periodStart", preview.periodStart);
      formData.set("periodEnd", preview.periodEnd);
      formData.set("fileHash", preview.fileHash);
      formData.set("normalRows", String(preview.normalRows));
      formData.set("excludedRows", String(preview.excludedRows));
      formData.set("amountTotal", String(preview.amountTotal));
      formData.set("warningRows", String(preview.warningRows));
      formData.set("errorRows", String(preview.errorRows));

      const response = await fetch("/api/sales-import/dry-run", { method: "POST", body: formData });
      const body = (await response.json()) as DryRunResponse | DryRunError;
      if (!response.ok || body.ok !== true) {
        const errorBody = body as DryRunError;
        const blocked = errorBody.blockedReasons?.length ? ` ${errorBody.blockedReasons.join(", ")}` : "";
        throw new Error(`${errorBody.error?.code ?? "DRY_RUN_BLOCKED"}${blocked}`);
      }
      setDryRun(body);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "DRY_RUN_BLOCKED");
    } finally {
      setIsDryRunning(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-slate-900 text-white">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sales XLS preview</h2>
            <p className="text-[15px] leading-6 text-slate-600">Aggregate-only validation for ERP sales workbooks.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-[15px] font-semibold">
            XLS file
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
                setDryRun(null);
                setError("");
              }}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[15px]"
            />
          </label>

          <label className="block text-[15px] font-semibold">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3">
              {roles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[15px] font-semibold">
            Managed parts
            <input value={managedParts} onChange={(event) => setManagedParts(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
          </label>

          <label className="block text-[15px] font-semibold">
            Selected part
            <select value={partCode} onChange={(event) => setPartCode(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3">
              {parts.map((option) => (
                <option key={option || "auto"} value={option}>
                  {option ? `Part ${option}` : "Auto detect"}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[15px] font-semibold">
              Start
              <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
            </label>
            <label className="block text-[15px] font-semibold">
              End
              <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
            </label>
          </div>

          <label className="block text-[15px] font-semibold">
            Filename month
            <input type="month" value={periodMonth} onChange={(event) => setPeriodMonth(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
          </label>

          <Button type="button" onClick={submitPreview} disabled={isLoading} className="h-11 w-full">
            <FileSpreadsheet className="size-4" />
            {isLoading ? "Checking" : "Preview"}
          </Button>
          <Button type="button" onClick={runDryRun} disabled={!preview || !file || isDryRunning} className="h-11 w-full" variant="outline">
            {isDryRunning ? "Running dry-run" : "Dry-run"}
          </Button>
          <Button type="button" disabled className="h-11 w-full" variant="outline" data-sync-disabled="true">
            Sync requires approval
          </Button>

          {file ? <div className="break-all rounded-md bg-slate-50 p-3 text-[14px] text-slate-600">{file.name}</div> : null}
          {error ? (
            <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-[14px] leading-6 text-red-900">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-700 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Aggregate preview</h2>
            <p className="text-[15px] leading-6 text-slate-600">No row payloads, persistence, or sync actions are returned.</p>
          </div>
        </div>

        {preview ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Metric label="Part" value={preview.part ? `Part ${preview.part}` : "-"} />
              <Metric label="Period" value={`${preview.periodStart} ~ ${preview.periodEnd}`} />
              <Metric label="File hash" value={shortHash(preview.fileHash)} />
              <Metric label="Normal rows" value={formatNumber(preview.normalRows)} />
              <Metric label="Excluded rows" value={formatNumber(preview.excludedRows)} />
              <Metric label="Amount total" value={formatWon(preview.amountTotal)} />
              <Metric label="Warnings" value={formatNumber(preview.warningRows)} />
              <Metric label="Errors" value={formatNumber(preview.errorRows)} />
              <Metric label="Raw rows returned" value={String(preview.rawRowsReturned)} />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <InfoPanel
                title="Permission"
                lines={[
                  `role: ${preview.permission.role}`,
                  `allowedParts: ${preview.permission.allowedParts.join(", ") || "-"}`,
                  `crossPartBlocked: ${String(preview.permission.crossPartBlocked)}`,
                ]}
              />
              <InfoPanel
                title="Side effects"
                lines={[
                  `dbWrite: ${String(preview.sideEffects.dbWrite)}`,
                  `storageWrite: ${String(preview.sideEffects.storageWrite)}`,
                  `sync: ${String(preview.sideEffects.sync)}`,
                  `apply: ${String(preview.sideEffects.apply)}`,
                ]}
              />
            </div>

            <InfoPanel
              title="File"
              lines={[
                `fileName: ${preview.fileName}`,
                `selectedPart: ${preview.selectedPart || "auto"}`,
                `filePart: ${preview.filePart || "-"}`,
                `blockedReasons: ${preview.blockedReasons.join(", ") || "-"}`,
                `warnings: ${preview.warnings.join(", ") || "-"}`,
              ]}
            />
            <InfoPanel
              title="Sync approval"
              lines={[
                "status: approval required",
                `roleScope: ${preview.permission.role} -> ${preview.permission.allowedParts.join(", ") || "-"}`,
                "syncEnabled: false",
                "applyEnabled: false",
              ]}
            />

            {dryRun ? (
              <div className="space-y-3 rounded-md border border-slate-200 p-3">
                <div className="text-[16px] font-semibold text-slate-900">Dry-run</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Metric label="Primary scope rows" value={formatNumber(dryRun.primaryScopeRows)} />
                  <Metric label="Existing scoped rows" value={formatNumber(dryRun.existingScopedRows)} />
                  <Metric label="Insert candidates" value={formatNumber(dryRun.insertCandidates)} />
                  <Metric label="Update candidates" value={formatNumber(dryRun.updateCandidates)} />
                  <Metric label="Removed candidates" value={formatNumber(dryRun.removedFromCurrentCandidates)} />
                  <Metric label="No-change rows" value={formatNumber(dryRun.noChangeRows)} />
                  <Metric label="Amount before" value={formatWon(dryRun.amountBefore)} />
                  <Metric label="Amount after" value={formatWon(dryRun.amountAfter)} />
                  <Metric label="Amount delta" value={formatWon(dryRun.amountDelta)} />
                  <Metric label="Blocked rows" value={formatNumber(dryRun.blockedRows)} />
                  <Metric label="Plan ready" value={String(dryRun.planReady)} />
                  <Metric label="Raw rows returned" value={String(dryRun.rawRowsReturned)} />
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <InfoPanel
                    title="Dry-run safety"
                    lines={[
                      `dbWrite: ${String(dryRun.sideEffects.dbWrite)}`,
                      `storageWrite: ${String(dryRun.sideEffects.storageWrite)}`,
                      `sync: ${String(dryRun.sideEffects.sync)}`,
                      `apply: ${String(dryRun.sideEffects.apply)}`,
                      `physicalDelete: ${String(dryRun.sideEffects.physicalDelete)}`,
                    ]}
                  />
                  <InfoPanel title="Dry-run blockers" lines={[dryRun.blockedReasons.join(", ") || "-"]} />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 rounded-md bg-slate-50 p-6 text-[15px] text-slate-600">Choose an ERP sales workbook to view the aggregate preview.</div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="text-[14px] text-slate-500">{label}</div>
      <div className="mt-1 break-words text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function InfoPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 text-[14px] leading-6">
      <div className="font-semibold text-slate-800">{title}</div>
      <ul className="mt-2 space-y-1 text-slate-600">
        {lines.map((line) => (
          <li key={line} className="break-all">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortHash(value: string) {
  return value.length > 24 ? `${value.slice(0, 18)}...${value.slice(-8)}` : value;
}
