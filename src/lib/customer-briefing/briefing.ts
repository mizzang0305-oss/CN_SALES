import type { CustomerDetail } from "@/lib/types";

export type UnitPriceDirection = "up" | "down" | "same" | "unknown";
export type TaskTransitionAction = "complete" | "postpone" | "reconfirm";

export function calculateUnitPriceChange(unitPrice: number, previousUnitPrice: number | null | undefined) {
  if (!previousUnitPrice) {
    return { direction: "unknown" as UnitPriceDirection, amount: 0, rate: 0, label: "직전 단가 없음" };
  }

  const amount = unitPrice - previousUnitPrice;
  const rate = previousUnitPrice === 0 ? 0 : (amount / previousUnitPrice) * 100;
  if (amount > 0) return { direction: "up" as UnitPriceDirection, amount, rate, label: "단가 상승" };
  if (amount < 0) return { direction: "down" as UnitPriceDirection, amount, rate, label: "단가 하락" };
  return { direction: "same" as UnitPriceDirection, amount, rate, label: "단가 동일" };
}

export function buildMobileCustomerBriefing(customer: CustomerDetail) {
  const latestVisit = customer.visits[0] ?? null;
  const nextPromise = customer.promises[0] ?? null;
  const openIssueCount = customer.claims.filter((claim) => !isCompleted(claim.status)).length;
  const receiptRate = customer.monthSales > 0 ? (customer.monthReceipts / customer.monthSales) * 100 : 0;

  return {
    summary: {
      customerId: customer.id,
      customerName: customer.name,
      customerCode: customer.code,
      partCode: customer.partCode,
      salesRepName: customer.salesRepName,
      currentArBalance: customer.currentArBalance,
      lastReceiptDate: customer.lastReceiptDate,
      recentReceiptAmount: customer.monthReceipts,
      recentSaleDate: customer.lastSaleDate,
      monthSales: customer.monthSales,
      monthReceipts: customer.monthReceipts,
      receiptRate,
      nextPromiseDate: customer.nextPromiseDate,
      promiseAmount: customer.promiseAmount,
      openIssueCount,
      todayTaskCount: customer.promises.filter((promise) => promise.status === "오늘").length,
      nextCheckDate: nextPromise?.promisedDate ?? customer.nextPromiseDate,
      managementLabel: "확인 필요 거래처",
      managementPriority: customer.managementStatus || "관리 우선순위 확인",
    },
    recentSales: customer.recentSales.map((sale) => ({
      ...sale,
      unitPriceChange: calculateUnitPriceChange(sale.unitPrice, sale.previousUnitPrice),
    })),
    ar: {
      currentBalance: customer.currentArBalance,
      weekDelta: null,
      monthEndDelta: null,
      lastReceiptDate: customer.lastReceiptDate,
      recentReceiptAmount: customer.monthReceipts,
      promiseDate: customer.nextPromiseDate,
      promiseAmount: customer.promiseAmount,
      status: "회입 확인 필요",
    },
    productUsage: customer.products.map((product) => ({
      ...product,
      usageLabel: normalizeProductUsageStatus(product.status),
      priceDeltaFromAverage: product.latestUnitPrice - product.averageUnitPrice90d,
    })),
    claims: customer.claims.map((claim) => ({
      ...claim,
      label: "처리 이슈",
      hasAttachment: false,
      finalResolutionSummary: isCompleted(claim.status) ? "최종 해결방안 확인" : "해결방안 확인 필요",
    })),
    visits: customer.visits.map((visit) => ({
      ...visit,
      nextActionDate: nextPromise?.promisedDate ?? customer.nextPromiseDate,
    })),
    tasks: customer.promises.map((promise) => ({
      ...promise,
      actionLabels: ["완료", "연기", "재확인"],
    })),
    latestVisit,
  };
}

export function transitionTaskStatus(
  task: CustomerDetail["promises"][number],
  action: TaskTransitionAction,
  nextDate?: string,
) {
  if (action === "complete") return { ...task, status: "완료" };
  if (action === "postpone") return { ...task, status: "연기", promisedDate: nextDate ?? task.promisedDate };
  return { ...task, status: "재확인 필요" };
}

function isCompleted(status: string) {
  return /완료|처리완료|closed|done/i.test(status);
}

function normalizeProductUsageStatus(status: string) {
  if (/신규/.test(status)) return "신규시도";
  if (/위험/.test(status)) return "이탈위험";
  if (/주의/.test(status)) return "이탈주의";
  if (/이탈/.test(status)) return "이탈";
  return status || "사용중";
}
