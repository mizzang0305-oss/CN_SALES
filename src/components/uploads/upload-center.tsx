"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber, formatWon } from "@/lib/format";
import { extractPartCodeFromText, getSelectedFilePartMismatch } from "@/lib/import/master-data";
import type { ImportAction, LedgerRawRow, LedgerRowType, UploadPreviewSummary } from "@/lib/types";

const sampleRows: LedgerRawRow[] = [
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "거래처계", 매출액: 18400000, 외상잔액: 31800000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 상품명: "왕만두", 수량: 20, 단가: 42000, 매출액: 840000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "입금", 입금액: 9000000, 입금할인: 200000 },
];

const partOptions = ["1", "4", "5", "6", "7", "9", "10", "11"].map((partCode) => ({
  value: partCode,
  label: `${partCode}파트`,
}));

type PreviewRow = {
  rowKey: string;
  rowIndex: number;
  rowType: LedgerRowType;
  customerName: string | null;
  salesAmount: number;
  receiptAmount: number;
  receiptDiscount: number;
  action: ImportAction;
};

type PreviewResponse = {
  ok?: boolean;
  previewId: string;
  summary: UploadPreviewSummary;
  rows: PreviewRow[];
  rowTypeCounts: Record<string, number>;
  blockedReasons?: string[];
  blocked_reasons?: string[];
  mode?: string;
  apply?: { enabled: boolean; reason: string };
};

type PreviewErrorResponse = {
  error?: string | { code?: string; message?: string };
  blocked_reasons?: string[];
};

export function UploadCenter() {
  const [partCode, setPartCode] = useState("1");
  const [periodStart, setPeriodStart] = useState("2026-06-01");
  const [periodEnd, setPeriodEnd] = useState("2026-06-30");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("미리보기 전");
  const [errorMessage, setErrorMessage] = useState("");

  const rowsJson = useMemo(() => JSON.stringify(sampleRows, null, 2), []);
  const filePartCode = useMemo(() => extractPartCodeFromText(file?.name ?? ""), [file]);
  const partMismatch = useMemo(() => getSelectedFilePartMismatch({ selectedPartCode: partCode, fileName: file?.name }), [file, partCode]);
  const confirmDisabled = !preview?.summary.canCommit || Boolean(partMismatch);

  function resetPreview(nextStatus = "미리보기 전") {
    setPreview(null);
    setCommitResult(null);
    setErrorMessage("");
    setStatus(nextStatus);
  }

  async function createPreview() {
    setStatus(partMismatch ? "파트 확인 후 미리보기 생성 중" : "미리보기 생성 중");
    setCommitResult(null);
    setErrorMessage("");

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
        const reason = getPreviewErrorMessage(result);
        throw new Error(reason);
      }

      setPreview(result);
      setStatus(result.summary?.canCommit ? (partMismatch ? "파트 확인 필요" : "DB 반영 가능") : "확인 필요");
    } catch (error) {
      const message = error instanceof Error ? error.message : "미리보기 생성 실패";
      setPreview(null);
      setErrorMessage(message);
      setStatus("미리보기 실패");
    }
  }

  async function confirmCommit() {
    if (!preview || confirmDisabled) return;
    setStatus("DB 반영 처리 중");
    setErrorMessage("");
    const response = await fetch("/api/uploads/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ previewId: preview.previewId }),
    });
    const result = await response.json();
    setCommitResult(result as Record<string, unknown>);
    setStatus(result.status === "committed" ? "반영 완료" : result.status === "blocked" ? "반영 차단" : "확인 필요");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-slate-900 text-white">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">원장 업로드</h2>
            <p className="text-[15px] text-slate-500">미리보기 후 명시적으로 반영합니다.</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block text-[15px] font-semibold">
            원장 파일
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
              <div className="font-semibold">{file.name}</div>
              <div>파일명 감지 파트: {filePartCode ? `${filePartCode}파트` : "감지 안 됨"}</div>
            </div>
          )}
          {partMismatch && (
            <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-[14px] leading-6 text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>{partMismatch.message} 미리보기는 가능하지만 DB 반영은 선택 파트를 맞춘 뒤 진행됩니다.</div>
            </div>
          )}
          <label className="block text-[15px] font-semibold">
            시작일
            <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
          </label>
          <label className="block text-[15px] font-semibold">
            종료일
            <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
          </label>
          <div className="rounded-md bg-slate-50 p-3 text-[14px] leading-6 text-slate-600">
            {file ? "선택한 파일로 Python parser를 실행합니다." : "파일이 없으면 아래 샘플 fixture로 미리보기를 생성합니다."}
          </div>
          {!file && <pre className="max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">{rowsJson}</pre>}
          <div className="flex gap-2">
            <Button type="button" onClick={createPreview} className="h-11 flex-1">
              미리보기 생성
            </Button>
            <Button type="button" variant="outline" onClick={() => resetPreview()} className="h-11">
              초기화
            </Button>
          </div>
          <Button type="button" disabled={confirmDisabled} onClick={confirmCommit} className="h-11 w-full">
            DB 반영
          </Button>
          <div className="text-[15px] font-semibold text-slate-700">상태: {status}</div>
          {errorMessage && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-[14px] leading-6 text-red-900">{errorMessage}</div>}
          {preview?.mode === "fixture" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[14px] leading-6 text-amber-900">
              fixture mode
              {(preview.blocked_reasons ?? []).length > 0 && <div className="mt-1">{preview.blocked_reasons?.join(" ")}</div>}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold">검증 결과</h2>
        </div>
        {preview ? (
          <>
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              {[
                ["전체 행", formatNumber(preview.summary.totalRows)],
                ["분석 가능", formatNumber(preview.summary.parsableRows)],
                ["신규", formatNumber(preview.summary.insertRows)],
                ["수정", formatNumber(preview.summary.updateRows)],
                ["동일", formatNumber(preview.summary.skippedRows)],
                ["오류", formatNumber(preview.summary.errorRows)],
                ["매출 합계", formatWon(preview.summary.salesTotal)],
                ["회입 합계", formatWon(preview.summary.receiptTotal)],
                ["외상잔액", formatWon(preview.summary.arBalance)],
                ["반영 방식", preview.summary.commitMode],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-200 p-3">
                  <div className="text-[15px] text-slate-500">{label}</div>
                  <div className="mt-1 text-[20px] font-semibold">{value}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 border-t border-slate-200 p-4 lg:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-3 text-[15px]">
                <div className="font-semibold">row_type_counts</div>
                <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(preview.rowTypeCounts, null, 2)}</pre>
              </div>
              <div className="rounded-md bg-slate-50 p-3 text-[15px]">
                <div className="font-semibold">blocked_reasons</div>
                <div className="mt-2 text-slate-600">{[...(preview.blockedReasons ?? []), ...(preview.blocked_reasons ?? [])].join(" ") || "없음"}</div>
              </div>
            </div>
            <table className="w-full border-collapse text-[15px]">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">행</th>
                  <th className="px-4 py-3 text-left">유형</th>
                  <th className="px-4 py-3 text-left">거래처</th>
                  <th className="px-4 py-3 text-right">매출</th>
                  <th className="px-4 py-3 text-right">회입</th>
                  <th className="px-4 py-3 text-left">처리</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowKey} className="border-t border-slate-200">
                    <td className="px-4 py-3">{row.rowIndex}</td>
                    <td className="px-4 py-3">{row.rowType}</td>
                    <td className="px-4 py-3">{row.customerName}</td>
                    <td className="px-4 py-3 text-right">{formatWon(row.salesAmount)}</td>
                    <td className="px-4 py-3 text-right">{formatWon(row.receiptAmount + row.receiptDiscount)}</td>
                    <td className="px-4 py-3">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {commitResult && (
              <div className="border-t border-slate-200 p-4">
                <h3 className="text-lg font-semibold">반영 결과</h3>
                <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">
                  {JSON.stringify(commitResult, null, 2)}
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-[15px] text-slate-500">미리보기를 생성하면 검증 결과가 표시됩니다.</div>
        )}
      </section>
    </div>
  );
}

function getPreviewErrorMessage(result: PreviewErrorResponse) {
  if (typeof result.error === "object" && result.error?.message) return result.error.message;
  if (typeof result.error === "string" && result.error) return result.error;
  return result.blocked_reasons?.join(" ") || "미리보기 생성 실패";
}
