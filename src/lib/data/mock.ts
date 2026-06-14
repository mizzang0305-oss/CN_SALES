import type { CustomerDetail, CustomerSummary, DashboardPartSummary } from "@/lib/types";

export const dashboardParts: DashboardPartSummary[] = [
  { partCode: "A", partName: "1파트", salesAmount: 128400000, receiptAmount: 94200000, arBalance: 36200000, targetAmount: 150000000 },
  { partCode: "B", partName: "2파트", salesAmount: 103500000, receiptAmount: 81400000, arBalance: 28400000, targetAmount: 120000000 },
  { partCode: "C", partName: "3파트", salesAmount: 88200000, receiptAmount: 70900000, arBalance: 18600000, targetAmount: 100000000 },
];

export const customers: CustomerSummary[] = [
  {
    id: "cust-001",
    code: "C001",
    name: "한빛마트",
    partCode: "A",
    salesRepName: "김민수",
    currentArBalance: 31800000,
    monthSales: 18400000,
    monthReceipts: 9200000,
    lastSaleDate: "2026-06-07",
    lastReceiptDate: "2026-05-30",
    nextPromiseDate: "2026-06-10",
    promiseAmount: 12000000,
    managementStatus: "집중관리",
  },
  {
    id: "cust-002",
    code: "C002",
    name: "청담식자재",
    partCode: "B",
    salesRepName: "이서연",
    currentArBalance: 8600000,
    monthSales: 12600000,
    monthReceipts: 11000000,
    lastSaleDate: "2026-06-06",
    lastReceiptDate: "2026-06-05",
    nextPromiseDate: "2026-06-08",
    promiseAmount: 3000000,
    managementStatus: "개선중",
  },
  {
    id: "cust-003",
    code: "C003",
    name: "동서급식",
    partCode: "C",
    salesRepName: "박준호",
    currentArBalance: 14200000,
    monthSales: 7400000,
    monthReceipts: 2100000,
    lastSaleDate: "2026-05-29",
    lastReceiptDate: "2026-05-22",
    nextPromiseDate: "2026-06-04",
    promiseAmount: 5000000,
    managementStatus: "약속일 재확인",
  },
];

export const customerDetails: Record<string, CustomerDetail> = Object.fromEntries(
  customers.map((customer) => [
    customer.id,
    {
      ...customer,
      monthlySales: [
        { month: "2026-04", sales: 14800000, receipts: 11200000 },
        { month: "2026-05", sales: 16100000, receipts: 12800000 },
        { month: "2026-06", sales: customer.monthSales, receipts: customer.monthReceipts },
      ],
      recentSales: [
        { date: "2026-06-07", productName: "왕만두", quantity: 20, unitPrice: 42000, amount: 840000, previousUnitPrice: 41000 },
        { date: "2026-06-05", productName: "돈까스", quantity: 12, unitPrice: 61500, amount: 738000, previousUnitPrice: 61500 },
        { date: "2026-06-02", productName: "튀김세트", quantity: 8, unitPrice: 53000, amount: 424000, previousUnitPrice: 57000 },
      ],
      products: [
        { productName: "왕만두", status: "사용중", lastPurchaseDate: "2026-06-07", latestUnitPrice: 42000, averageUnitPrice90d: 40500, monthlyAverageSales: 3400000 },
        { productName: "돈까스", status: "신규시도", lastPurchaseDate: "2026-06-05", latestUnitPrice: 61500, averageUnitPrice90d: 61500, monthlyAverageSales: 1800000 },
        { productName: "핫도그", status: "이탈주의", lastPurchaseDate: "2026-04-25", latestUnitPrice: 27000, averageUnitPrice90d: 27800, monthlyAverageSales: 900000 },
      ],
      claims: [
        { id: "claim-001", date: "2026-06-03", issueSummary: "배송 수량 확인 요청", status: "진행" },
        { id: "claim-002", date: "2026-05-18", issueSummary: "품질 확인 후 교환 처리", status: "완료" },
      ],
      visits: [
        { id: "visit-001", date: "2026-06-07", purpose: "미수관리", summary: "입금 예정일과 다음 주문 품목 확인" },
        { id: "visit-002", date: "2026-05-24", purpose: "신규상품제안", summary: "튀김세트 샘플 반응 확인" },
      ],
      promises: [
        { id: "task-001", title: "입금 일정 재확인", promisedDate: customer.nextPromiseDate, promisedAmount: customer.promiseAmount, status: customer.managementStatus.includes("재확인") ? "지연" : "오늘" },
        { id: "task-002", title: "단가표 전달", promisedDate: "2026-06-12", promisedAmount: null, status: "예정" },
      ],
    },
  ]),
);

export function getDashboardSummary() {
  const totals = dashboardParts.reduce(
    (sum, part) => ({
      salesAmount: sum.salesAmount + part.salesAmount,
      receiptAmount: sum.receiptAmount + part.receiptAmount,
      arBalance: sum.arBalance + part.arBalance,
      targetAmount: sum.targetAmount + part.targetAmount,
    }),
    { salesAmount: 0, receiptAmount: 0, arBalance: 0, targetAmount: 0 },
  );

  return {
    ...totals,
    receiptRate: totals.salesAmount ? (totals.receiptAmount / totals.salesAmount) * 100 : 0,
    targetRate: totals.targetAmount ? (totals.salesAmount / totals.targetAmount) * 100 : 0,
    parts: dashboardParts,
    recentUploads: [],
  };
}
