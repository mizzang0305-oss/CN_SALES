"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber, formatWon } from "@/lib/format";
import { extractPartCodeFromText, getSelectedFilePartMismatch } from "@/lib/import/master-data";
import type { LedgerRawRow, UploadPreviewSummary } from "@/lib/types";

const sampleRows: LedgerRawRow[] = [
  { date: "2026-06-07", customer_name: "Synthetic Customer", row_type: "customer_total", sales_amount: 18400000, ar_balance: 31800000 },
  { date: "2026-06-07", customer_name: "Synthetic Customer", product_name: "Synthetic Product", quantity: 20, unit_price: 42000, sales_amount: 840000 },
  { date: "2026-06-07", customer_name: "Synthetic Customer", row_type: "receipt", receipt_amount: 9000000, receipt_discount: 200000 },
];

const partOptions = ["1", "4", "5", "6", "7", "9", "10", "11"].map((partCode) => ({
  value: partCode,
  label: `${partCode}파트`,
}));

const confirmationLabels = {
  previewChecked: "preview 결과를 확인했습니다.",
  partMatchChecked: "선택 파트와 파일 파트가 일치합니다.",
  rollbackAcknowledged: "DB 반영은 되돌림 절차가 필요할 수 있음을 확인했습니다.",
} as const;

type OperatorConfirmations = Record<keyof typeof confirmationLabels, boolean>;

type OperationalPreviewSummary = {
  totalRows: number;
  normalRows: number;
  excludedOrErrorRows: number;
  partMismatch: boolean;
  selectedPartCode: string;
  filePartCode: string | null;
  amountTotal: number;
  salesTotal: number;
  receiptTotal: number;
  customerCount: number;
  productCount: number;
  warnings: string[];
};

type PreviewResponse = {
  ok?: boolean;
  previewId: string;
  uploadRecordId?: string;
  summary: UploadPreviewSummary;
  blockedReasons?: string[];
  blocked_reasons?: string[];
  mode?: string;
  operationalSummary: OperationalPreviewSummary;
  apply?: { enabled: boolean; reason: string };
};

type PreviewErrorResponse = {
  error?: string | { code?: string; message?: string };
  blocked_reasons?: string[];
};

type ApplyReport = {
  status?: string;
  import_batch_id?: string;
  applied_count?: number;
  rejected_count?: number;
  operator?: string | null;
  created_at?: string;
  blocked_reasons?: string[];
};

export function UploadCenter() {
  const [partCode, setPartCode] = useState("1");
  const [periodStart, setPeriodStart] = useState("2026-06-01");
  const [periodEnd, setPeriodEnd] = useState("2026-06-30");
  const [file, setFile] = useState<File | null>(null);
  const [operator, setOperator] = useState("");
  const [confirmations, setConfirmations] = useState<OperatorConfirmations>({
    previewChecked: false,
    partMatchChecked: false,
    rollbackAcknowledged: false,
  });
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [applyReport, setApplyReport] = useState<ApplyReport | null>(null);
  const [status, setStatus] = useState("미리보기 대기");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const filePartCode = useMemo(() => extractPartCodeFromText(file?.name ?? ""), [file]);
  const partMismatch = useMemo(() => getSelectedFilePartMismatch({ selectedPartCode: partCode, fileName: file?.name }), [file, partCode]);
  const warnings = useMemo(() => {
    if (!preview) return partMismatch ? [partMismatch.code] : [];
    return preview.operationalSummary.warnings;
  }, [partMismatch, preview]);
  const confirmationReady = Object.values(confirmations).every(Boolean);
  const operatorReady = operator.trim().length > 0;
  const previewReady = Boolean(preview?.ok && preview.summary.canCommit && preview.apply?.enabled && !preview.operationalSummary.partMismatch);
  const applyDisabled = isApplying || !previewReady || !operatorReady || !confirmationReady;

  function resetPreview(nextStatus = "미리보기 대기") {
    setPreview(null);
    setApplyReport(null);
    setErrorMessage("");
    setStatus(nextStatus);
    setConfirmations({
      previewChecked: false,
      partMatchChecked: false,
      rollbackAcknowledged: false,
    });
  }

  async function createPreview() {
    setIsPreviewing(true);
    setStatus(partMismatch ? "파트 불일치 확인 필요" : "미리보기 생성 중");
    setApplyReport(null);
    setErrorMessage("");
    setConfirmations({
      previewChecked: false,
      partMatchChecked: false,
      rollbackAcknowledged: false,
    });

    try {
      let response: Response;
      if (file) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("partCode", partCode);
        formData.set("periodStart", periodStart);
        formData.set("periodEnd", periodEnd);
        response = await fetch("/api/uploads/preview", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/uploads/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fileName: "sample-ledger.json",
            partCode,
            periodStart,
            periodEnd,
            rows: sampleRows,
          }),
        });
      }

      const result = (await response.json()) as PreviewResponse & PreviewErrorResponse;
      if (!response.ok) {
        throw new Error(getPreviewErrorMessage(result, response.status));
      }

      setPreview(result);
      if (result.operationalSummary.partMismatch) {
        setStatus("파트 불일치 - DB 반영 차단");
      } else if (!result.summary.canCommit || !result.apply?.enabled) {
        setStatus(`DB 반영 대기 불가: ${result.apply?.reason ?? "PREVIEW_BLOCKED"}`);
      } else {
        setStatus("미리보기 완료 - 운영자 확인 필요");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "미리보기 생성 실패";
      setPreview(null);
      setErrorMessage(message);
      setStatus("미리보기 실패");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function confirmApply() {
    if (!preview || applyDisabled) return;
    setIsApplying(true);
    setStatus("수동 DB 반영 요청 중");
    setErrorMessage("");

    try {
      const response = await fetch("/api/uploads/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          previewId: preview.previewId,
          operator: operator.trim(),
          confirmations,
        }),
      });
      const result = (await response.json()) as ApplyReport;
      setApplyReport(result);
      setStatus(result.status === "committed" ? "DB 반영 완료" : "DB 반영 차단");
      if (!response.ok) {
        setErrorMessage(result.blocked_reasons?.join(" ") || "DB 반영 요청이 거부되었습니다.");
      }
    } catch {
      setStatus("DB 반영 실패");
      setErrorMessage("DB 반영 요청이 실패했습니다.");
    } finally {
      setIsApplying(false);
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
            <h2 className="text-lg font-semibold">엑셀 업로드</h2>
            <p className="text-[15px] text-slate-500">운영자가 미리보기 확인 후 수동으로 DB 반영합니다.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-[15px] font-semibold">
            엑셀 파일
            <input
              type="file"
              accept=".xls,.xlsx,.json"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                resetPreview("파일 선택됨");
              }}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[15px]"
            />
          </label>

          <label className="block text-[15px] font-semibold">
            파트
            <select
              value={partCode}
              onChange={(event) => {
                setPartCode(event.target.value);
                resetPreview("파트 변경됨");
              }}
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3"
            >
              {partOptions.map((part) => (
                <option key={part.value} value={part.value}>
                  {part.label}
                </option>
              ))}
            </select>
          </label>

          {file && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[14px] leading-6 text-slate-700">
              <div className="flex items-center gap-2 font-semibold">
                <FileSpreadsheet className="size-4" />
                <span className="truncate">{file.name}</span>
              </div>
              <div>파일명 감지 파트: {filePartCode ? `${filePartCode}파트` : "감지 안 됨"}</div>
            </div>
          )}

          {partMismatch && (
            <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-[14px] leading-6 text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>{partMismatch.message} 파트가 맞지 않으면 DB 반영 버튼은 열리지 않습니다.</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[15px] font-semibold">
              시작일
              <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
            </label>
            <label className="block text-[15px] font-semibold">
              종료일
              <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
            </label>
          </div>

          <label className="block text-[15px] font-semibold">
            operator
            <input
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              placeholder="운영자 이름 또는 계정"
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3"
            />
          </label>

          <div className="rounded-md bg-slate-50 p-3 text-[14px] leading-6 text-slate-600">
            {file ? "선택한 파일로 preview를 생성합니다. DB 반영은 별도 확인 후에만 가능합니다." : "파일이 없으면 synthetic fixture로 preview 화면만 확인합니다."}
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={createPreview} disabled={isPreviewing} className="h-11 flex-1">
              {isPreviewing ? "생성 중" : "미리보기 생성"}
            </Button>
            <Button type="button" variant="outline" onClick={() => resetPreview()} className="h-11">
              초기화
            </Button>
          </div>

          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <div className="text-[15px] font-semibold">DB 반영 전 확인</div>
            {(Object.keys(confirmationLabels) as Array<keyof typeof confirmationLabels>).map((key) => (
              <label key={key} className="flex min-h-11 items-center gap-2 text-[14px] text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmations[key]}
                  onChange={(event) => setConfirmations((current) => ({ ...current, [key]: event.target.checked }))}
                  disabled={!preview || preview.operationalSummary.partMismatch}
                  className="size-4"
                />
                {confirmationLabels[key]}
              </label>
            ))}
          </div>

          <Button type="button" disabled={applyDisabled} onClick={confirmApply} className="h-11 w-full">
            {isApplying ? "반영 요청 중" : "수동 DB 반영"}
          </Button>

          <div className="text-[15px] font-semibold text-slate-700">상태: {status}</div>
          {errorMessage && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-[14px] leading-6 text-red-900">{errorMessage}</div>}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold">preview 결과</h2>
        </div>
        {preview ? (
          <div className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["총 row 수", formatNumber(preview.operationalSummary.totalRows)],
                ["정상 row 수", formatNumber(preview.operationalSummary.normalRows)],
                ["제외/오류 row 수", formatNumber(preview.operationalSummary.excludedOrErrorRows)],
                ["파트 불일치", preview.operationalSummary.partMismatch ? "있음" : "없음"],
                ["금액 합계", formatWon(preview.operationalSummary.amountTotal)],
                ["거래처 수", formatNumber(preview.operationalSummary.customerCount)],
                ["품목 수", formatNumber(preview.operationalSummary.productCount)],
                ["반영 상태", preview.apply?.enabled ? "확인 필요" : preview.apply?.reason ?? "차단"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-200 p-3">
                  <div className="text-[15px] text-slate-500">{label}</div>
                  <div className="mt-1 text-[22px] font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 p-3 text-[15px] leading-7">
                <div className="font-semibold">파트 확인</div>
                <div>선택 파트: {preview.operationalSummary.selectedPartCode || "-"}파트</div>
                <div>파일 파트: {preview.operationalSummary.filePartCode ? `${preview.operationalSummary.filePartCode}파트` : "감지 안 됨"}</div>
              </div>
              <div className="rounded-md border border-slate-200 p-3 text-[15px] leading-7">
                <div className="font-semibold">세부 합계</div>
                <div>매출 합계: {formatWon(preview.operationalSummary.salesTotal)}</div>
                <div>회입 합계: {formatWon(preview.operationalSummary.receiptTotal)}</div>
              </div>
            </div>

            <div className="rounded-md bg-slate-50 p-3 text-[15px] leading-7">
              <div className="font-semibold">경고 목록</div>
              {warnings.length ? (
                <ul className="mt-2 space-y-1">
                  {warnings.map((warning) => (
                    <li key={warning} className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-600" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  <span>경고 없음</span>
                </div>
              )}
            </div>

            {applyReport && (
              <div className="rounded-md border border-slate-200 p-3">
                <h3 className="text-lg font-semibold">반영 결과 report</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <ReportField label="import_batch_id" value={applyReport.import_batch_id ?? "-"} />
                  <ReportField label="applied_count" value={formatNumber(applyReport.applied_count ?? 0)} />
                  <ReportField label="rejected_count" value={formatNumber(applyReport.rejected_count ?? 0)} />
                  <ReportField label="operator" value={applyReport.operator ?? "-"} />
                  <ReportField label="created_at" value={applyReport.created_at ?? "-"} />
                  <ReportField label="status" value={applyReport.status ?? "-"} />
                </div>
                {applyReport.blocked_reasons?.length ? (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-[14px] text-amber-900">
                    {applyReport.blocked_reasons.join(" ")}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-[15px] text-slate-500">미리보기를 생성하면 요약 결과가 표시됩니다.</div>
        )}
      </section>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-[14px] text-slate-500">{label}</div>
      <div className="mt-1 break-all text-[16px] font-semibold">{value}</div>
    </div>
  );
}

function getPreviewErrorMessage(result: PreviewErrorResponse, statusCode: number) {
  if (typeof result.error === "object") {
    const code = result.error.code ?? "INVALID_UPLOAD_FILE";
    const message = result.error.message ?? "업로드 파일을 읽을 수 없습니다.";
    if (statusCode === 415 || code === "INVALID_UPLOAD_FILE") return `415 ${code} - ${message}`;
    return `${code} - ${message}`;
  }
  if (typeof result.error === "string" && result.error) return result.error;
  return result.blocked_reasons?.join(" ") || "미리보기 생성 실패";
}
