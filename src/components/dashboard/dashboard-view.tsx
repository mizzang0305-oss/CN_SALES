"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { formatPercent, formatWon } from "@/lib/format";
import { getDashboardSummary } from "@/lib/data/mock";
import type { DashboardTotals } from "@/lib/import/types";

export function DashboardView({ data = { ...getDashboardSummary(), mode: "fixture", blockedReasons: [] } }: { data?: DashboardTotals }) {
  const cards = [
    { label: "총 매출", value: formatWon(data.salesAmount) },
    { label: "총 회입", value: formatWon(data.receiptAmount) },
    { label: "회입률", value: formatPercent(data.receiptRate) },
    { label: "외상잔액", value: formatWon(data.arBalance) },
    { label: "목표 대비", value: formatPercent(data.targetRate) },
  ];

  return (
    <div className="space-y-5">
      {data.mode === "fixture" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[15px] leading-6 text-amber-900">
          fixture mode: Supabase DB 조회가 막혀 샘플 데이터가 표시됩니다.
          {data.blockedReasons.length > 0 && <div className="mt-1">{data.blockedReasons.join(" ")}</div>}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-[15px] font-medium text-slate-500">{card.label}</div>
            <div className="mt-3 text-[24px] font-semibold tracking-normal text-slate-950">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">파트별 요약</h2>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[760px]">
            <BarChart width={860} height={280} data={data.parts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="partName" />
              <YAxis tickFormatter={(value) => `${Number(value) / 1000000}백만`} />
              <Tooltip formatter={(value) => formatWon(Number(value))} />
              <Bar dataKey="salesAmount" name="매출" fill="#0f172a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="receiptAmount" name="회입" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold">최근 업로드/반영 이력</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[15px]">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">import_batch_id</th>
                <th className="px-4 py-3 text-left font-semibold">파일</th>
                <th className="px-4 py-3 text-left font-semibold">파트</th>
                <th className="px-4 py-3 text-left font-semibold">상태</th>
                <th className="px-4 py-3 text-right font-semibold">반영</th>
                <th className="px-4 py-3 text-right font-semibold">제외/오류</th>
                <th className="px-4 py-3 text-left font-semibold">operator</th>
                <th className="px-4 py-3 text-left font-semibold">created_at</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUploads.length ? (
                data.recentUploads.map((upload) => (
                  <tr key={upload.importBatchId} className="border-t border-slate-200">
                    <td className="max-w-[180px] truncate px-4 py-3 font-mono text-[13px]">{upload.importBatchId}</td>
                    <td className="max-w-[220px] truncate px-4 py-3">{upload.fileName}</td>
                    <td className="px-4 py-3">{upload.partCode}파트</td>
                    <td className="px-4 py-3">{upload.status}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{upload.appliedCount.toLocaleString("ko-KR")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{upload.rejectedCount.toLocaleString("ko-KR")}</td>
                    <td className="px-4 py-3">{upload.operator ?? "-"}</td>
                    <td className="px-4 py-3">{upload.createdAt || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    아직 업로드/반영 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-[15px]">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">파트</th>
              <th className="px-4 py-3 text-right font-semibold">매출</th>
              <th className="px-4 py-3 text-right font-semibold">회입</th>
              <th className="px-4 py-3 text-right font-semibold">외상잔액</th>
              <th className="px-4 py-3 text-right font-semibold">목표 대비</th>
            </tr>
          </thead>
          <tbody>
            {data.parts.map((part) => (
              <tr key={part.partCode} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{part.partName}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatWon(part.salesAmount)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatWon(part.receiptAmount)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatWon(part.arBalance)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {part.targetAmount ? formatPercent((part.salesAmount / part.targetAmount) * 100) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
