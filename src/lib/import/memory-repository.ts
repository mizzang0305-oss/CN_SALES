import { createNormalizedRows } from "@/lib/import/normalization";
import { classifyUsageStatus, defaultPartName, normalizeMasterName } from "@/lib/import/master-data";
import type { ConfirmResult, DashboardTotals, ImportPreviewRecord, ImportRepository } from "@/lib/import/types";
import type { ParsedLedgerRow } from "@/lib/types";

type StoredLedgerRow = ParsedLedgerRow & { id: string; uploadRecordId: string };
type MemorySalesPart = {
  id: string;
  partCode: string;
  partName: string;
  source: "ledger";
  isActive: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
};
type MemoryCustomer = {
  id: string;
  partCode: string;
  rawCustomerName: string;
  normalizedCustomerName: string;
  source: "ledger";
  firstSeenAt: string;
  lastSeenAt: string;
};
type MemoryProduct = {
  id: string;
  rawProductName: string;
  normalizedProductName: string;
  source: "ledger";
  firstSeenAt: string;
  lastSeenAt: string;
};
type MemoryAlias = {
  id: string;
  aliasName: string;
  normalizedAliasName: string;
  source: "ledger";
};
type MemoryCustomerProductUsage = {
  id: string;
  partCode: string;
  customerId: string;
  productId: string;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  purchaseCount: number;
  totalQuantity: number;
  totalSalesAmount: number;
  usageStatus: string;
};

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
  salesParts: MemorySalesPart[] = [];
  customers: MemoryCustomer[] = [];
  products: MemoryProduct[] = [];
  customerAliases: MemoryAlias[] = [];
  productAliases: MemoryAlias[] = [];
  customerProductUsage: MemoryCustomerProductUsage[] = [];

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
    this.rebuildMasterData();

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
    const partCodes = this.salesParts.length ? this.salesParts.map((part) => part.partCode) : [...new Set(this.ledgerRows.map((row) => row.partCode))];
    const parts = partCodes.map((partCode) => ({
      partCode,
      partName: this.salesParts.find((part) => part.partCode === partCode)?.partName ?? defaultPartName(partCode),
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

  private rebuildMasterData() {
    const previousParts = new Map(this.salesParts.map((part) => [part.partCode, part]));
    const previousCustomers = new Map(this.customers.map((customer) => [customer.normalizedCustomerName, customer]));
    const previousProducts = new Map(this.products.map((product) => [product.normalizedProductName, product]));
    const nextParts = new Map<string, MemorySalesPart>();
    const nextCustomers = new Map<string, MemoryCustomer>();
    const nextProducts = new Map<string, MemoryProduct>();
    const nextCustomerAliases = new Map<string, MemoryAlias>();
    const nextProductAliases = new Map<string, MemoryAlias>();
    const nextUsage = new Map<string, MemoryCustomerProductUsage>();
    const referenceDate = latestLedgerDate(this.ledgerRows);

    for (const row of this.ledgerRows) {
      const previousPart = previousParts.get(row.partCode);
      const part = previousPart ?? {
        id: crypto.randomUUID(),
        partCode: row.partCode,
        partName: defaultPartName(row.partCode),
        source: "ledger" as const,
        isActive: true,
        firstSeenAt: row.ledgerDate,
        lastSeenAt: row.ledgerDate,
      };
      nextParts.set(row.partCode, {
        ...part,
        firstSeenAt: earlierDate(part.firstSeenAt, row.ledgerDate) ?? row.ledgerDate,
        lastSeenAt: laterDate(part.lastSeenAt, row.ledgerDate) ?? row.ledgerDate,
      });

      const customer = row.customerName ? upsertCustomer({
        row,
        previousCustomers,
        nextCustomers,
        nextCustomerAliases,
      }) : null;
      const product = row.productName ? upsertProduct({
        row,
        previousProducts,
        nextProducts,
        nextProductAliases,
      }) : null;

      if (row.rowType === "item_detail" && customer && product) {
        const key = `${row.partCode}:${customer.id}:${product.id}`;
        const existing = nextUsage.get(key) ?? {
          id: crypto.randomUUID(),
          partCode: row.partCode,
          customerId: customer.id,
          productId: product.id,
          firstPurchaseDate: row.ledgerDate,
          lastPurchaseDate: row.ledgerDate,
          purchaseCount: 0,
          totalQuantity: 0,
          totalSalesAmount: 0,
          usageStatus: "active",
        };

        existing.firstPurchaseDate = earlierDate(existing.firstPurchaseDate, row.ledgerDate);
        existing.lastPurchaseDate = laterDate(existing.lastPurchaseDate, row.ledgerDate);
        existing.purchaseCount += 1;
        existing.totalQuantity += row.quantity;
        existing.totalSalesAmount += row.salesAmount;
        existing.usageStatus = classifyUsageStatus({
          firstPurchaseDate: existing.firstPurchaseDate,
          lastPurchaseDate: existing.lastPurchaseDate,
          referenceDate,
        });
        nextUsage.set(key, existing);
      }
    }

    this.salesParts = [...nextParts.values()];
    this.customers = [...nextCustomers.values()];
    this.products = [...nextProducts.values()];
    this.customerAliases = [...nextCustomerAliases.values()];
    this.productAliases = [...nextProductAliases.values()];
    this.customerProductUsage = [...nextUsage.values()];
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

function upsertCustomer(input: {
  row: StoredLedgerRow;
  previousCustomers: Map<string, MemoryCustomer>;
  nextCustomers: Map<string, MemoryCustomer>;
  nextCustomerAliases: Map<string, MemoryAlias>;
}) {
  const rawCustomerName = input.row.customerName ?? "";
  const normalizedCustomerName = normalizeMasterName(rawCustomerName);
  if (!normalizedCustomerName) return null;
  const existing = input.nextCustomers.get(normalizedCustomerName)
    ?? input.previousCustomers.get(normalizedCustomerName)
    ?? {
      id: crypto.randomUUID(),
      partCode: input.row.partCode,
      rawCustomerName,
      normalizedCustomerName,
      source: "ledger" as const,
      firstSeenAt: input.row.ledgerDate,
      lastSeenAt: input.row.ledgerDate,
    };

  const customer = {
    ...existing,
    partCode: existing.partCode || input.row.partCode,
    rawCustomerName: existing.rawCustomerName || rawCustomerName,
    firstSeenAt: earlierDate(existing.firstSeenAt, input.row.ledgerDate) ?? input.row.ledgerDate,
    lastSeenAt: laterDate(existing.lastSeenAt, input.row.ledgerDate) ?? input.row.ledgerDate,
  };
  input.nextCustomers.set(normalizedCustomerName, customer);
  input.nextCustomerAliases.set(normalizedCustomerName, {
    id: crypto.randomUUID(),
    aliasName: rawCustomerName,
    normalizedAliasName: normalizedCustomerName,
    source: "ledger",
  });

  return customer;
}

function upsertProduct(input: {
  row: StoredLedgerRow;
  previousProducts: Map<string, MemoryProduct>;
  nextProducts: Map<string, MemoryProduct>;
  nextProductAliases: Map<string, MemoryAlias>;
}) {
  const rawProductName = input.row.productName ?? "";
  const normalizedProductName = normalizeMasterName(rawProductName);
  if (!normalizedProductName) return null;
  const existing = input.nextProducts.get(normalizedProductName)
    ?? input.previousProducts.get(normalizedProductName)
    ?? {
      id: crypto.randomUUID(),
      rawProductName,
      normalizedProductName,
      source: "ledger" as const,
      firstSeenAt: input.row.ledgerDate,
      lastSeenAt: input.row.ledgerDate,
    };

  const product = {
    ...existing,
    rawProductName: existing.rawProductName || rawProductName,
    firstSeenAt: earlierDate(existing.firstSeenAt, input.row.ledgerDate) ?? input.row.ledgerDate,
    lastSeenAt: laterDate(existing.lastSeenAt, input.row.ledgerDate) ?? input.row.ledgerDate,
  };
  input.nextProducts.set(normalizedProductName, product);
  input.nextProductAliases.set(normalizedProductName, {
    id: crypto.randomUUID(),
    aliasName: rawProductName,
    normalizedAliasName: normalizedProductName,
    source: "ledger",
  });

  return product;
}

function latestLedgerDate(rows: StoredLedgerRow[]) {
  return rows.reduce<string | null>((latest, row) => laterDate(latest, row.ledgerDate), null);
}

function earlierDate(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return left <= right ? left : right;
}

function laterDate(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return left >= right ? left : right;
}
