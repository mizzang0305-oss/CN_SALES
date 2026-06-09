import { describe, expect, it } from "vitest";
import type { LedgerRawRow } from "@/lib/types";
import { ImportService } from "@/lib/import/import-service";
import { MemoryImportRepository } from "@/lib/import/memory-repository";
import { MemoryStorageAdapter } from "@/lib/storage/memory-storage";

const baseRows: LedgerRawRow[] = [
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "거래처계", 매출액: 1000, 외상잔액: 3000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 상품명: "왕만두", 수량: 1, 단가: 1000, 매출액: 1000 },
  { 일자: "2026-06-07", 거래처명: "한빛마트", 구분: "입금", 입금액: 700, 입금할인: 50 },
];

const masterRows: LedgerRawRow[] = [
  { date: "2026-06-09", customer_name: "Seoul Mart", row_type: "customer_total", sales_amount: 1000, ar_balance: 3000 },
  { date: "2026-06-09", customer_name: "Seoul Mart", product_name: "Kimchi 10kg", quantity: 2, unit_price: 500, sales_amount: 1000 },
];

function createService() {
  const repository = new MemoryImportRepository();
  const service = new ImportService({
    repository,
    storage: new MemoryStorageAdapter(),
    parseRows: async () => baseRows,
  });
  return { repository, service };
}

describe("Phase 2 Supabase-style import flow", () => {
  it("preview stores preview results but does not create normalized rows", async () => {
    const { repository, service } = createService();

    const preview = await service.preview({
      file: new File(["fixture"], "ledger.xlsx"),
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });

    expect(preview.summary.totalRows).toBe(3);
    expect(preview.summary.salesTotal).toBe(1000);
    expect(repository.normalized.salesTransactions).toHaveLength(0);
    expect(repository.previewResults.get(preview.previewId)).toBeTruthy();
  });

  it("confirm creates ledger rows and normalized data once", async () => {
    const { repository, service } = createService();
    const preview = await service.preview({
      file: new File(["fixture"], "ledger.xlsx"),
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });

    const first = await service.confirm(preview.previewId);
    const second = await service.confirm(preview.previewId);

    expect(first.inserted).toBe(3);
    expect(second.inserted).toBe(0);
    expect(second.skipped).toBe(3);
    expect(repository.ledgerRows).toHaveLength(3);
    expect(repository.normalized.salesTransactions).toHaveLength(1);
    expect(repository.normalized.receiptTransactions).toHaveLength(1);
    expect(repository.normalized.arSnapshots).toHaveLength(1);
    expect(repository.dashboardTotals().salesAmount).toBe(1000);
    expect(repository.dashboardTotals().receiptAmount).toBe(750);
  });

  it("content hash changes version the row and regenerate normalized data", async () => {
    const repository = new MemoryImportRepository();
    let rows = baseRows;
    const service = new ImportService({
      repository,
      storage: new MemoryStorageAdapter(),
      parseRows: async () => rows,
    });

    const firstPreview = await service.preview({
      file: new File(["fixture"], "ledger.xlsx"),
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });
    await service.confirm(firstPreview.previewId);

    rows = [{ ...baseRows[0], 매출액: 1200, 외상잔액: 3300 }, baseRows[1], baseRows[2]];
    const updatePreview = await service.preview({
      file: new File(["fixture"], "ledger.xlsx"),
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });
    const updated = await service.confirm(updatePreview.previewId);

    expect(updatePreview.summary.updateRows).toBe(1);
    expect(updated.updated).toBe(1);
    expect(repository.ledgerRowVersions).toHaveLength(1);
    expect(repository.normalized.salesTransactions).toHaveLength(1);
    expect(repository.normalized.arSnapshots.at(-1)?.arBalance).toBe(3300);
    expect(repository.dashboardTotals().salesAmount).toBe(1200);
  });

  it("resolves missing part code from ledger file name before preview is stored", async () => {
    const repository = new MemoryImportRepository();
    const service = new ImportService({
      repository,
      storage: new MemoryStorageAdapter(),
      parseRows: async () => masterRows,
    });

    const preview = await service.preview({
      file: new File(["fixture"], "2026-06_4파트_ledger.xlsx"),
      partCode: "",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });
    await service.confirm(preview.previewId);

    expect(preview.summary.partCode).toBe("4");
    expect(preview.blockedReasons).toEqual([]);
    expect(repository.salesParts).toMatchObject([{ partCode: "4", partName: "4파트", source: "ledger" }]);
  });

  it("resolves missing part code from ledger rows and blocks when no part is available", async () => {
    const blockedRepository = new MemoryImportRepository();
    const blockedService = new ImportService({
      repository: blockedRepository,
      storage: new MemoryStorageAdapter(),
      parseRows: async () => masterRows,
    });

    const blockedPreview = await blockedService.preview({
      file: new File(["fixture"], "ledger.xlsx"),
      partCode: "",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });
    const blockedConfirm = await blockedService.confirm(blockedPreview.previewId);

    expect(blockedPreview.blockedReasons).toContain("PART_REQUIRED");
    expect(blockedPreview.summary.canCommit).toBe(false);
    expect(blockedConfirm.status).toBe("blocked");
    expect(blockedRepository.ledgerRows).toHaveLength(0);

    const rowPartRepository = new MemoryImportRepository();
    const rowPartService = new ImportService({
      repository: rowPartRepository,
      storage: new MemoryStorageAdapter(),
      parseRows: async () => masterRows.map((row) => ({ ...row, part_name: "7파트" })),
    });
    const rowPartPreview = await rowPartService.preview({
      file: new File(["fixture"], "ledger.xlsx"),
      partCode: "",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });

    expect(rowPartPreview.summary.partCode).toBe("7");
    expect(rowPartPreview.blockedReasons).toEqual([]);
  });

  it("upserts ledger-derived customer, product, aliases, and usage without duplicating skipped confirms", async () => {
    const repository = new MemoryImportRepository();
    const service = new ImportService({
      repository,
      storage: new MemoryStorageAdapter(),
      parseRows: async () => masterRows,
    });

    const preview = await service.preview({
      file: new File(["fixture"], "ledger.xlsx"),
      partCode: "A",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
    });
    await service.confirm(preview.previewId);
    await service.confirm(preview.previewId);

    expect(repository.salesParts).toMatchObject([{ partCode: "A", partName: "A파트" }]);
    expect(repository.customers).toMatchObject([
      { rawCustomerName: "Seoul Mart", normalizedCustomerName: "seoulmart", partCode: "A" },
    ]);
    expect(repository.customerAliases).toMatchObject([
      { aliasName: "Seoul Mart", normalizedAliasName: "seoulmart" },
    ]);
    expect(repository.products).toMatchObject([
      { rawProductName: "Kimchi 10kg", normalizedProductName: "kimchi10kg" },
    ]);
    expect(repository.productAliases).toMatchObject([
      { aliasName: "Kimchi 10kg", normalizedAliasName: "kimchi10kg" },
    ]);
    expect(repository.customerProductUsage).toMatchObject([
      {
        partCode: "A",
        purchaseCount: 1,
        totalQuantity: 2,
        totalSalesAmount: 1000,
        usageStatus: "new",
      },
    ]);
  });
});
