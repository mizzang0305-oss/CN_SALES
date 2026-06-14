import type { ParsedLedgerRow, UploadPreviewResult, UploadPreviewSummary } from "@/lib/types";

export interface ImportPreviewRecord extends UploadPreviewResult {
  previewId: string;
  uploadRecordId: string;
  storagePath: string;
  createdAt?: string;
  blockedReasons: string[];
  rowTypeCounts: Record<string, number>;
  sampleRows: Array<ParsedLedgerRow & { action: string }>;
}

export interface ConfirmResult {
  status: "committed" | "blocked" | "rejected";
  previewId: string;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  missingCandidates: number;
  importBatchId?: string;
  appliedCount?: number;
  rejectedCount?: number;
  operator?: string | null;
  createdAt?: string;
  normalized: {
    salesTransactions: number;
    receiptTransactions: number;
    arSnapshots: number;
  };
  blockedReasons: string[];
}

export interface DashboardTotals {
  salesAmount: number;
  receiptAmount: number;
  receiptRate: number;
  arBalance: number;
  targetAmount: number;
  targetRate: number;
  parts: Array<{
    partCode: string;
    partName: string;
    salesAmount: number;
    receiptAmount: number;
    arBalance: number;
    targetAmount: number;
  }>;
  recentUploads: Array<{
    importBatchId: string;
    fileName: string;
    partCode: string;
    status: string;
    createdAt: string;
    appliedCount: number;
    rejectedCount: number;
    operator: string | null;
  }>;
  mode: "fixture" | "supabase";
  blockedReasons: string[];
}

export interface ImportRepository {
  createPreview(input: {
    fileName: string;
    storagePath: string;
    partCode: string;
    periodStart: string;
    periodEnd: string;
    summary: UploadPreviewSummary;
    rows: ImportPreviewRecord["rows"];
    rowTypeCounts: Record<string, number>;
    sampleRows: ImportPreviewRecord["sampleRows"];
    blockedReasons: string[];
  }): Promise<ImportPreviewRecord>;
  getExistingContentHashes(identityHashes: string[]): Promise<Record<string, string>>;
  getPreview(previewId: string): Promise<ImportPreviewRecord | null>;
  confirmPreview(preview: ImportPreviewRecord): Promise<ConfirmResult>;
  getDashboardTotals(): Promise<DashboardTotals>;
}
