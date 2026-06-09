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
});
