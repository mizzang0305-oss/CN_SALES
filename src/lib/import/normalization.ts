import type { ParsedLedgerRow } from "@/lib/types";

export function createNormalizedRows(rows: Array<ParsedLedgerRow & { id?: string }>) {
  const salesTransactions = rows
    .filter((row) => row.rowType === "customer_total")
    .map((row) => ({
      ledgerRowId: row.id ?? row.identityHash,
      customerName: row.customerName,
      partCode: row.partCode,
      transactionDate: row.ledgerDate,
      salesAmount: row.salesAmount,
    }));

  const receiptTransactions = rows
    .filter((row) => row.rowType === "receipt")
    .map((row) => ({
      ledgerRowId: row.id ?? row.identityHash,
      customerName: row.customerName,
      partCode: row.partCode,
      transactionDate: row.ledgerDate,
      receiptAmount: row.receiptAmount,
      receiptDiscount: row.receiptDiscount,
      totalReceiptAmount: row.receiptAmount + row.receiptDiscount,
    }));

  const latestArByCustomer = new Map<string, (typeof rows)[number]>();

  rows
    .filter((row) => row.arBalance !== null)
    .sort((left, right) => left.ledgerDate.localeCompare(right.ledgerDate) || left.rowIndex - right.rowIndex)
    .forEach((row) => {
      latestArByCustomer.set(`${row.partCode}:${row.customerName ?? row.customerCode ?? row.identityHash}`, row);
    });

  const arSnapshots = [...latestArByCustomer.values()].map((row) => ({
    ledgerRowId: row.id ?? row.identityHash,
    customerName: row.customerName,
    partCode: row.partCode,
    snapshotDate: row.ledgerDate,
    arBalance: row.arBalance ?? 0,
  }));

  const productPriceHistory = rows
    .filter((row) => row.rowType === "item_detail")
    .map((row) => ({
      ledgerRowId: row.id ?? row.identityHash,
      customerName: row.customerName,
      productName: row.productName,
      partCode: row.partCode,
      priceDate: row.ledgerDate,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      salesAmount: row.salesAmount,
    }));

  return { salesTransactions, receiptTransactions, arSnapshots, productPriceHistory };
}
