import { describe, expect, it } from "vitest";
import { buildMobileCustomerBriefing, calculateUnitPriceChange, transitionTaskStatus } from "@/lib/customer-briefing/briefing";
import type { CustomerDetail } from "@/lib/types";

const customer: CustomerDetail = {
  id: "cust-a",
  code: "C001",
  name: "Alpha Mart",
  partCode: "A",
  salesRepName: "Rep A",
  currentArBalance: 12_000_000,
  monthSales: 20_000_000,
  monthReceipts: 8_000_000,
  lastSaleDate: "2026-06-08",
  lastReceiptDate: "2026-06-04",
  nextPromiseDate: "2026-06-12",
  promiseAmount: 5_000_000,
  managementStatus: "회입 확인 필요",
  monthlySales: [
    { month: "2026-05", sales: 18_000_000, receipts: 9_000_000 },
    { month: "2026-06", sales: 20_000_000, receipts: 8_000_000 },
  ],
  recentSales: [
    { date: "2026-06-08", productName: "Item A", quantity: 10, unitPrice: 12_000, amount: 120_000, previousUnitPrice: 10_000 },
    { date: "2026-06-07", productName: "Item B", quantity: 5, unitPrice: 8_000, amount: 40_000, previousUnitPrice: 9_000 },
  ],
  products: [
    { productName: "Item A", status: "사용중", lastPurchaseDate: "2026-06-08", latestUnitPrice: 12_000, averageUnitPrice90d: 11_000, monthlyAverageSales: 1_000_000 },
  ],
  claims: [
    { id: "claim-a", date: "2026-06-06", issueSummary: "배송 수량 확인", status: "진행중" },
    { id: "claim-b", date: "2026-06-01", issueSummary: "품질 확인 완료", status: "완료" },
  ],
  visits: [{ id: "visit-a", date: "2026-06-05", purpose: "회입 확인", summary: "다음 입금 일정 확인" }],
  promises: [
    { id: "task-a", title: "입금 약속 확인", promisedDate: "2026-06-12", promisedAmount: 5_000_000, status: "오늘" },
    { id: "task-b", title: "샘플 전달", promisedDate: "2026-06-13", promisedAmount: null, status: "예정" },
  ],
};

describe("mobile customer briefing", () => {
  it("returns the required mobile briefing sections without raw ledger rows", () => {
    const briefing = buildMobileCustomerBriefing(customer);

    expect(briefing.summary).toMatchObject({
      customerName: "Alpha Mart",
      currentArBalance: 12_000_000,
      recentSaleDate: "2026-06-08",
      openIssueCount: 1,
      managementLabel: "확인 필요 거래처",
    });
    expect(briefing.recentSales).toHaveLength(2);
    expect(briefing.ar.status).toBe("회입 확인 필요");
    expect(briefing.productUsage).toHaveLength(1);
    expect(briefing.claims[0]).toMatchObject({ label: "처리 이슈", hasAttachment: false });
    expect(briefing.visits[0]).toMatchObject({ nextActionDate: "2026-06-12" });
    expect(briefing.tasks.map((task) => task.actionLabels)).toContainEqual(["완료", "연기", "재확인"]);
    expect(JSON.stringify(briefing)).not.toMatch(/rawRowJson|service_role|publicUrl/i);
  });

  it("calculates unit price movement labels", () => {
    expect(calculateUnitPriceChange(12_000, 10_000)).toMatchObject({ direction: "up", label: "단가 상승" });
    expect(calculateUnitPriceChange(8_000, 9_000)).toMatchObject({ direction: "down", label: "단가 하락" });
    expect(calculateUnitPriceChange(10_000, 10_000)).toMatchObject({ direction: "same", label: "단가 동일" });
    expect(calculateUnitPriceChange(10_000, null)).toMatchObject({ direction: "unknown", label: "직전 단가 없음" });
  });

  it("builds safe task state transitions for complete, postpone, and reconfirm", () => {
    const task = customer.promises[0];

    expect(transitionTaskStatus(task, "complete")).toMatchObject({ id: "task-a", status: "완료" });
    expect(transitionTaskStatus(task, "postpone", "2026-06-14")).toMatchObject({ id: "task-a", status: "연기", promisedDate: "2026-06-14" });
    expect(transitionTaskStatus(task, "reconfirm")).toMatchObject({ id: "task-a", status: "재확인 필요" });
  });
});
