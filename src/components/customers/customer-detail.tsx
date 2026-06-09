"use client";

import { useMemo, useState } from "react";
import { buildMobileCustomerBriefing } from "@/lib/customer-briefing/briefing";
import { formatNumber, formatPercent, formatWon } from "@/lib/format";
import type { CustomerDetail } from "@/lib/types";

const tabs = ["요약", "매출", "미수", "상품", "처리 이슈", "방문일지", "약속"] as const;
type CustomerTab = (typeof tabs)[number];

export function CustomerDetailView({ customer, mobile = false }: { customer: CustomerDetail; mobile?: boolean }) {
  const [activeTab, setActiveTab] = useState<CustomerTab>("요약");
  const briefing = useMemo(() => buildMobileCustomerBriefing(customer), [customer]);
  const summary = briefing.summary;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-slate-500">{summary.managementLabel || "확인 필요 거래처"}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">{summary.customerName}</h2>
            <p className="mt-1 text-[15px] text-slate-500">
              {summary.customerCode} · {summary.partCode}파트 · 담당 {summary.salesRepName}
            </p>
          </div>
          <div className="rounded-md bg-blue-50 px-3 py-2 text-[15px] font-semibold text-blue-700">
            관리 우선순위: {summary.managementPriority}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="현재 외상잔액" value={formatWon(summary.currentArBalance)} />
          <Metric label="이번달 매출" value={formatWon(summary.monthSales)} />
          <Metric label="이번달 회입" value={formatWon(summary.monthReceipts)} />
          <Metric label="회입률" value={formatPercent(summary.receiptRate)} />
        </div>
      </section>

      <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 py-2" aria-label="거래처 상세 탭">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`h-11 shrink-0 rounded-md px-4 text-[15px] font-semibold ${
              activeTab === tab ? "bg-slate-900 text-white" : "bg-white text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "요약" && (
        <section className="grid gap-3 sm:grid-cols-2">
          <InfoCard title="방문 전 확인" rows={[
            ["최근 입금일", summary.lastReceiptDate],
            ["최근 입금액", formatWon(summary.recentReceiptAmount)],
            ["최근 매출일", summary.recentSaleDate],
            ["다음 확인 일정", summary.nextCheckDate],
          ]} />
          <InfoCard title="오늘 브리핑" rows={[
            ["입금 약속일", summary.nextPromiseDate],
            ["약속금액", formatWon(summary.promiseAmount)],
            ["진행중 처리 이슈", `${formatNumber(summary.openIssueCount)}건`],
            ["오늘 할 일", `${formatNumber(summary.todayTaskCount)}건`],
          ]} />
        </section>
      )}

      {activeTab === "매출" && (
        <section className="space-y-3">
          <div className="flex gap-2">
            {["30일", "60일", "90일"].map((label) => (
              <button key={label} type="button" className="h-11 rounded-md border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-700">
                {label}
              </button>
            ))}
          </div>
          <ListBlock
            items={briefing.recentSales.map((sale) => ({
              title: `${sale.date} · ${sale.productName}`,
              meta: `${formatNumber(sale.quantity)}개 · ${formatWon(sale.unitPrice)} · ${formatWon(sale.amount)}`,
              badge: `${sale.unitPriceChange.label}${sale.previousUnitPrice ? ` · 직전 ${formatWon(sale.previousUnitPrice)}` : ""}`,
              tone: sale.unitPriceChange.direction === "up" ? "warn" : sale.unitPriceChange.direction === "down" ? "info" : "neutral",
            }))}
            mobile={mobile}
          />
        </section>
      )}

      {activeTab === "미수" && (
        <section className="space-y-3">
          <InfoCard title="회입 확인 필요" rows={[
            ["현재잔액", formatWon(briefing.ar.currentBalance)],
            ["전주대비", briefing.ar.weekDelta === null ? "확인 예정" : formatWon(briefing.ar.weekDelta)],
            ["전월말대비", briefing.ar.monthEndDelta === null ? "확인 예정" : formatWon(briefing.ar.monthEndDelta)],
            ["최근입금", `${briefing.ar.lastReceiptDate} · ${formatWon(briefing.ar.recentReceiptAmount)}`],
            ["약속", `${briefing.ar.promiseDate} · ${formatWon(briefing.ar.promiseAmount)}`],
            ["상태", briefing.ar.status],
          ]} />
          <button type="button" className="h-11 w-full rounded-md bg-slate-900 px-4 text-[15px] font-semibold text-white">
            입금 약속 등록
          </button>
        </section>
      )}

      {activeTab === "상품" && (
        <ListBlock
          items={briefing.productUsage.map((product) => ({
            title: `${product.productName} · ${product.usageLabel}`,
            meta: `마지막 구매일 ${product.lastPurchaseDate} · 최근 단가 ${formatWon(product.latestUnitPrice)} · 평균 단가 ${formatWon(product.averageUnitPrice90d)}`,
            badge: product.priceDeltaFromAverage > 0 ? "단가 차이 확인" : "사용중",
            tone: product.priceDeltaFromAverage > 0 ? "warn" : "neutral",
          }))}
          mobile={mobile}
        />
      )}

      {activeTab === "처리 이슈" && (
        <section className="space-y-3">
          <ListBlock
            items={briefing.claims.map((claim) => ({
              title: claim.issueSummary,
              meta: `${claim.date} · 첨부 ${claim.hasAttachment ? "있음" : "없음"} · ${claim.finalResolutionSummary}`,
              badge: claim.status,
              tone: claim.status.includes("완료") ? "neutral" : "warn",
            }))}
            mobile={mobile}
          />
          <button type="button" className="h-11 w-full rounded-md bg-slate-900 px-4 text-[15px] font-semibold text-white">
            새 처리 이슈 등록
          </button>
        </section>
      )}

      {activeTab === "방문일지" && (
        <section className="space-y-3">
          <ListBlock
            items={briefing.visits.map((visit) => ({
              title: visit.purpose,
              meta: `${visit.date} · ${visit.summary}`,
              badge: `다음 조치 ${visit.nextActionDate}`,
              tone: "info",
            }))}
            mobile={mobile}
          />
          <button type="button" className="h-11 w-full rounded-md bg-slate-900 px-4 text-[15px] font-semibold text-white">
            방문일지 작성
          </button>
        </section>
      )}

      {activeTab === "약속" && (
        <ListBlock
          items={briefing.tasks.map((task) => ({
            title: task.title,
            meta: `${task.promisedDate}${task.promisedAmount ? ` · ${formatWon(task.promisedAmount)}` : ""}`,
            badge: `${task.status} · ${task.actionLabels.join("/")}`,
            tone: task.status.includes("지연") || task.status.includes("재확인") ? "warn" : "neutral",
          }))}
          mobile={mobile}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="text-[15px] text-slate-500">{label}</div>
      <div className="mt-2 text-right text-[23px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <dl className="mt-3 space-y-2 text-[15px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <dt className="shrink-0 text-slate-500">{label}</dt>
            <dd className="text-right font-semibold tabular-nums text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ListBlock({
  items,
  mobile,
}: {
  items: Array<{ title: string; meta: string; badge: string; tone?: "neutral" | "warn" | "info" }>;
  mobile: boolean;
}) {
  return (
    <section className={mobile ? "space-y-3" : "overflow-hidden rounded-lg border border-slate-200 bg-white"}>
      {items.map((item) => (
        <div
          key={`${item.title}-${item.meta}`}
          className={
            mobile
              ? "rounded-lg border border-slate-200 bg-white p-4"
              : "flex items-center justify-between gap-4 border-b border-slate-200 p-4 last:border-b-0"
          }
        >
          <div>
            <div className="text-[16px] font-semibold">{item.title}</div>
            <div className="mt-1 text-[15px] leading-6 text-slate-500">{item.meta}</div>
          </div>
          <div className={`mt-3 inline-flex rounded-md px-2 py-1 text-[14px] font-semibold sm:mt-0 ${badgeClass(item.tone)}`}>
            {item.badge}
          </div>
        </div>
      ))}
    </section>
  );
}

function badgeClass(tone: "neutral" | "warn" | "info" = "neutral") {
  if (tone === "warn") return "bg-amber-50 text-amber-700";
  if (tone === "info") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-700";
}
