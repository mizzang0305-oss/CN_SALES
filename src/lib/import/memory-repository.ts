import { createNormalizedRows } from "@/lib/import/normalization";
import type { ConfirmResult, DashboardTotals, ImportPreviewRecord, ImportRepository } from "@/lib/import/types";
import type { ParsedLedgerRow } from "@/lib/types";

type StoredLedgerRow = ParsedLedgerRow & { id: string; uploadRecordId: string };

export class MemoryImportRepository implements ImportRepository {
  previewResults = new Map<string, ImportPreviewRecord>();
  ledgerRows: StoredLedgerRow[] = [];
  ledgerRowVersions: Array<{
    ledgerRowId: string;
    previousContentHash: string;
    nextContentHash: string;
    previousRawRowJson: unknown;
    nextRawRowJson: unknown;
  }> = [];
  normalized = {
    salesTransactions: [] as ReturnType<typeof createNormalizedRows>["salesTransactions"],
    receiptTransactions: [] as ReturnType<typeof createNormalizedRows>["receiptTransactions"],
    arSnapshots: [] as ReturnType<typeof createNormalizedRows>["arSnapshots"],
    productPriceHistory: [] as ReturnType<typeof createNormalizedRows>["productPriceHistory"],
  };

  async createPreview(input: Parameters<ImportRepository["createPreview"]>[0]): Promise<ImportPreviewRecord> {
    const previewId = crypto.randomUUID();
    const record: ImportPreviewRecord = {
      previewId,
      uploadId: input.summary.fileName,
      uploadRecordId: crypto.randomUUID(),
      storagePath: input.storagePath,
      summary: input.summary,
      rows: input.rows,
      blockedReasons: input.blockedReasons,
      rowTypeCounts: input.rowTypeCounts,
      sampleRows: input.sampleRows,
    };
    this.previewResults.set(previewId, record);
    return record;
  }

  async getExistingContentHashes(identityHashes: string[]) {
    return Object.fromEntries(
      this.ledgerRows
        .filter((row) => identityHashes.includes(row.identityHash))
        .map((row) => [row.identityHash, row.contentHash]),
    );
  }

  async getPreview(previewId: string) {
    return this.previewResults.get(previewId) ?? null;
  }

  async confirmPreview(preview: ImportPreviewRecord): Promise<ConfirmResult> {
    if (preview.summary.errorRows > 0) {
      return this.rejected(preview.previewId, preview.summary.errorRows);
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const changedRows: StoredLedgerRow[] = [];

    for (const row of preview.rows) {
      const existing = this.ledgerRows.find((item) => item.identityHash === row.identityHash);
      if (!existing) {
        const created = { ...row, id: crypto.randomUUID(), uploadRecordId: preview.uploadRecordId };
        this.ledgerRows.push(created);
        changedRows.push(created);
        inserted += 1;
        continue;
      }

      if (existing.contentHash === row.contentHash) {
        skipped += 1;
        continue;
      }

      this.ledgerRowVersions.push({
        ledgerRowId: existing.id,
        previousContentHash: existing.contentHash,
        nextContentHash: row.contentHash,
        previousRawRowJson: existing.rawRowJson,
        nextRawRowJson: row.rawRowJson,
      });
      Object.assign(existing, row);
      changedRows.push(existing);
      updated += 1;
    }

    this.replaceNormalizedRows(changedRows);

    return {
      status: "committed",
      previewId: preview.previewId,
      inserted,
      updated,
      skipped,
      errors: 0,
      missingCandidates: 0,
      normalized: {
        salesTransactions: this.normalized.salesTransactions.length,
        receiptTransactions: this.normalized.receiptTransactions.length,
        arSnapshots: this.normalized.arSnapshots.length,
      },
      blockedReasons: [],
    };
  }

  async getDashboardTotals(): Promise<DashboardTotals> {
    return { ...this.dashboardTotals(), mode: "fixture", blockedReasons: [] };
  }

  dashboardTotals() {
    const salesAmount = this.normalized.salesTransactions.reduce((sum, row) => sum + row.salesAmount, 0);
    const receiptAmount = this.normalized.receiptTransactions.reduce((sum, row) => sum + row.totalReceiptAmount, 0);
    const arBalance = this.normalized.arSnapshots.reduce((sum, row) => sum + row.arBalance, 0);
    const targetAmount = 0;
    const parts = [...new Set(this.ledgerRows.map((row) => row.partCode))].map((partCode) => ({
      partCode,
      partName: `${partCode}파트`,
      salesAmount: this.normalized.salesTransactions.filter((row) => row.partCode === partCode).reduce((sum, row) => sum + row.salesAmount, 0),
      receiptAmount: this.normalized.receiptTransactions.filter((row) => row.partCode === partCode).reduce((sum, row) => sum + row.totalReceiptAmount, 0),
      arBalance: this.normalized.arSnapshots.filter((row) => row.partCode === partCode).reduce((sum, row) => sum + row.arBalance, 0),
      targetAmount,
    }));

    return {
      salesAmount,
      receiptAmount,
      receiptRate: salesAmount ? (receiptAmount / salesAmount) * 100 : 0,
      arBalance,
      targetAmount,
      targetRate: 0,
      parts,
    };
  }

  private replaceNormalizedRows(changedRows: StoredLedgerRow[]) {
    const changedIds = new Set(changedRows.map((row) => row.id));
    this.normalized.salesTransactions = this.normalized.salesTransactions.filter((row) => !changedIds.has(row.ledgerRowId));
    this.normalized.receiptTransactions = this.normalized.receiptTransactions.filter((row) => !changedIds.has(row.ledgerRowId));
    this.normalized.arSnapshots = this.normalized.arSnapshots.filter((row) => !changedIds.has(row.ledgerRowId));
    this.normalized.productPriceHistory = this.normalized.productPriceHistory.filter((row) => !changedIds.has(row.ledgerRowId));

    const normalized = createNormalizedRows(changedRows);
    this.normalized.salesTransactions.push(...normalized.salesTransactions);
    this.normalized.receiptTransactions.push(...normalized.receiptTransactions);
    this.normalized.arSnapshots.push(...normalized.arSnapshots);
    this.normalized.productPriceHistory.push(...normalized.productPriceHistory);
  }

  private rejected(previewId: string, errors: number): ConfirmResult {
    return {
      status: "rejected",
      previewId,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors,
      missingCandidates: 0,
      normalized: { salesTransactions: 0, receiptTransactions: 0, arSnapshots: 0 },
      blockedReasons: ["Preview contains error rows."],
    };
  }
}
