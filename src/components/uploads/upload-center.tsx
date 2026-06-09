"use client";

import { useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber, formatWon } from "@/lib/format";
import type { ImportPreviewRecord } from "@/lib/import/types";

const sampleRows = [
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "거래처계", 매출액: 18400000, 외상잔액: 31800000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 상품명: "왕만두", 수량: 20, 단가: 42000, 매출액: 840000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "입금", 입금액: 9000000, 입금할인: 200000 },
];

export function UploadCenter() {
  const [partCode, setPartCode] = useState("A");
  const [periodStart, setPeriodStart] = useState("2026-06-01");
  const [periodEnd, setPeriodEnd] = useState("2026-06-30");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<(ImportPreviewRecord & { mode?: string; blocked_reasons?: string[] }) | null>(null);
  const [commitResult, setCommitResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("미리보기 전");

  const rowsJson = useMemo(() => JSON.stringify(sampleRows, null, 2), []);

  async function createPreview() {
    setStatus("미리보기 생성 중");
    setCommitResult(null);
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

    const result = (await response.json()) as ImportPreviewRecord & { mode?: string; blocked_reasons?: string[] };
    setPreview(result);
    setStatus(result.summary?.canCommit ? "DB 반영 가능" : "확인 필요");
  }

  async function confirmCommit() {
    if (!preview) return;
    setStatus("DB 반영 처리 중");
    const response = await fetch("/api/uploads/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ previewId: preview.previewId }),
    });
    const result = await response.json();
    setCommitResult(result as Record<string, unknown>);
    setStatus(result.status === "committed" ? "반영 완료" : result.status === "blocked" ? "fixture mode" : "확인 필요");
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
            <p className="text-[15px] text-slate-500">preview 후 confirm 시점에만 정규화 데이터가 생성됩니다.</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block text-[15px] font-semibold">
            원장 파일
            <input
              type="file"
              accept=".xls,.xlsx,.json"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[15px]"
            />
          </label>
          <label className="block text-[15px] font-semibold">
            파트
            <select value={partCode} onChange={(event) => setPartCode(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3">
              <option value="A">1파트</option>
              <option value="B">2파트</option>
              <option value="C">3파트</option>
            </select>
          </label>
          <label className="block text-[15px] font-semibold">
            시작일
            <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
          </label>
          <label className="block text-[15px] font-semibold">
            종료일
            <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
          </label>
          <div className="rounded-md bg-slate-50 p-3 text-[14px] leading-6 text-slate-600">
            파일을 선택하면 실제 업로드 파일로 Python parser를 실행합니다. 파일이 없으면 샘플 JSON으로 fixture 흐름을 확인합니다.
          </div>
          <pre className="max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">{rowsJson}</pre>
          <div className="flex gap-2">
            <Button type="button" onClick={createPreview} className="h-11 flex-1">
              미리보기 생성
            </Button>
            <Button type="button" variant="outline" onClick={() => setPreview(null)} className="h-11">
              취소
            </Button>
          </div>
          <Button type="button" disabled={!preview?.summary.canCommit} onClick={confirmCommit} className="h-11 w-full">
            DB 반영
          </Button>
          <div className="text-[15px] font-semibold text-slate-700">상태: {status}</div>
          {preview?.mode === "fixture" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[14px] leading-6 text-amber-900">
              fixture mode: Supabase DB 쓰기는 비활성화되어 있습니다.
              {(preview.blocked_reasons ?? []).length > 0 && <div className="mt-1">{preview.blocked_reasons?.join(" ")}</div>}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold">검산 결과</h2>
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
                  <tr key={row.identityHash} className="border-t border-slate-200">
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
          <div className="p-8 text-[15px] text-slate-500">미리보기를 생성하면 검산 결과가 표시됩니다.</div>
        )}
      </section>
    </div>
  );
}
