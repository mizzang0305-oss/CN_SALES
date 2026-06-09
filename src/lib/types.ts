export type UserRole =
  | "sales_rep"
  | "part_leader"
  | "team_leader"
  | "executive"
  | "admin";

export type LedgerRowType =
  | "item_detail"
  | "customer_total"
  | "daily_total"
  | "grand_total"
  | "receipt"
  | "unknown";

export type ImportAction = "insert" | "update" | "skipped" | "error";

export type LedgerRawRow = Record<string, string | number | null>;

export interface ParsedLedgerRow {
  rowIndex: number;
  rowType: LedgerRowType;
  partCode: string;
  ledgerDate: string;
  customerCode: string | null;
  customerName: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  salesAmount: number;
  receiptAmount: number;
  receiptDiscount: number;
  arBalance: number | null;
  identityHash: string;
  contentHash: string;
  rawRowJson: LedgerRawRow;
  errors: string[];
}

export interface UploadPreviewSummary {
  fileName: string;
  partCode: string;
  periodStart: string;
  periodEnd: string;
  totalRows: number;
  parsableRows: number;
  insertRows: number;
  updateRows: number;
  skippedRows: number;
  errorRows: number;
  salesTotal: number;
  receiptTotal: number;
  arBalance: number;
  canCommit: boolean;
  commitMode: "preview_only" | "upsert_by_hash";
}

export interface UploadPreviewResult {
  uploadId: string;
  summary: UploadPreviewSummary;
  rows: Array<ParsedLedgerRow & { action: ImportAction }>;
}

export interface DashboardPartSummary {
  partCode: string;
  partName: string;
  salesAmount: number;
  receiptAmount: number;
  arBalance: number;
  targetAmount: number;
}

export interface CustomerSummary {
  id: string;
  code: string;
  name: string;
  partCode: string;
  salesRepName: string;
  currentArBalance: number;
  monthSales: number;
  monthReceipts: number;
  lastSaleDate: string;
  lastReceiptDate: string;
  nextPromiseDate: string;
  promiseAmount: number;
  managementStatus: string;
}

export interface CustomerDetail extends CustomerSummary {
  monthlySales: Array<{ month: string; sales: number; receipts: number }>;
  recentSales: Array<{
    date: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    previousUnitPrice: number | null;
  }>;
  products: Array<{
    productName: string;
    status: string;
    lastPurchaseDate: string;
    latestUnitPrice: number;
    averageUnitPrice90d: number;
    monthlyAverageSales: number;
  }>;
  claims: Array<{ id: string; date: string; issueSummary: string; status: string }>;
  visits: Array<{ id: string; date: string; purpose: string; summary: string }>;
  promises: Array<{
    id: string;
    title: string;
    promisedDate: string;
    promisedAmount: number | null;
    status: string;
  }>;
}
