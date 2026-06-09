"use client";

import { useState } from "react";
import { formatWon } from "@/lib/format";
import type { CustomerDetail } from "@/lib/types";

const tabs = ["요약", "매출", "미수", "상품", "처리 이슈", "방문일지", "약속"];

export function CustomerDetailView({ customer, mobile = false }: { customer: CustomerDetail; mobile?: boolean }) {
  const [activeTab, setActiveTab] = useState("요약");

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{customer.name}</h2>
            <p className="mt-1 text-[15px] text-slate-500">
              {customer.code} · {customer.partCode}파트 · 담당 {customer.salesRepName}
            </p>
          </div>
          <div className="rounded-md bg-blue-50 px-3 py-2 text-[15px] font-semibold text-blue-700">{customer.managementStatus}</div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            ["현재 외상잔액", formatWon(customer.currentArBalance)],
            ["이번달 매출", formatWon(customer.monthSales)],
            ["이번달 회입", formatWon(customer.monthReceipts)],
            ["약속금액", formatWon(customer.promiseAmount)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-slate-200 p-3">
              <div className="text-[15px] text-slate-500">{label}</div>
              <div className="mt-2 text-[23px] font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 py-2">
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
      </div>

      {activeTab === "요약" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-[15px] leading-7">
          <p>
            방문 전 확인: 최근 입금일은 {customer.lastReceiptDate}이고 약속일은 {customer.nextPromiseDate}입니다. 회입 일정과
            최근 주문 감소 여부를 함께 확인하세요.
          </p>
        </section>
      )}

      {activeTab === "매출" && (
        <ListBlock
          items={customer.recentSales.map((sale) => ({
            title: `${sale.date} · ${sale.productName}`,
            meta: `${sale.quantity}개 · ${formatWon(sale.unitPrice)} · ${formatWon(sale.amount)}`,
            badge:
              sale.previousUnitPrice && sale.previousUnitPrice !== sale.unitPrice
                ? `직전 ${formatWon(sale.previousUnitPrice)}`
                : "단가 동일",
          }))}
          mobile={mobile}
        />
      )}

      {activeTab === "미수" && (
        <ListBlock
          items={[
            { title: "현재잔액", meta: formatWon(customer.currentArBalance), badge: customer.managementStatus },
            { title: "최근입금", meta: `${customer.lastReceiptDate} · ${formatWon(customer.monthReceipts)}`, badge: "확인" },
            { title: "입금 약속", meta: `${customer.nextPromiseDate} · ${formatWon(customer.promiseAmount)}`, badge: "재확인" },
          ]}
          mobile={mobile}
        />
      )}

      {activeTab === "상품" && (
        <ListBlock
          items={customer.products.map((product) => ({
            title: `${product.productName} · ${product.status}`,
            meta: `마지막 ${product.lastPurchaseDate} · 최근 ${formatWon(product.latestUnitPrice)}`,
            badge:
              product.latestUnitPrice < product.averageUnitPrice90d * 0.9
                ? "할인 확인"
                : product.latestUnitPrice > product.averageUnitPrice90d * 1.1
                  ? "단가 확인"
                  : "정상",
          }))}
          mobile={mobile}
        />
      )}

      {activeTab === "처리 이슈" && <ListBlock items={customer.claims.map((item) => ({ title: item.issueSummary, meta: item.date, badge: item.status }))} mobile={mobile} />}
      {activeTab === "방문일지" && <ListBlock items={customer.visits.map((item) => ({ title: item.purpose, meta: `${item.date} · ${item.summary}`, badge: "기록" }))} mobile={mobile} />}
      {activeTab === "약속" && <ListBlock items={customer.promises.map((item) => ({ title: item.title, meta: `${item.promisedDate}${item.promisedAmount ? ` · ${formatWon(item.promisedAmount)}` : ""}`, badge: item.status }))} mobile={mobile} />}
    </div>
  );
}

function ListBlock({ items, mobile }: { items: Array<{ title: string; meta: string; badge: string }>; mobile: boolean }) {
  return (
    <section className={mobile ? "space-y-3" : "overflow-hidden rounded-lg border border-slate-200 bg-white"}>
      {items.map((item) => (
        <div key={`${item.title}-${item.meta}`} className={mobile ? "rounded-lg border border-slate-200 bg-white p-4" : "flex items-center justify-between border-b border-slate-200 p-4 last:border-b-0"}>
          <div>
            <div className="text-[16px] font-semibold">{item.title}</div>
            <div className="mt-1 text-[15px] text-slate-500">{item.meta}</div>
          </div>
          <div className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[14px] font-semibold text-slate-700 sm:mt-0">{item.badge}</div>
        </div>
      ))}
    </section>
  );
}
