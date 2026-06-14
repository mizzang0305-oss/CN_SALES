import { describe, expect, it } from "vitest";
import { createPreviewChecksum, hashBytes, toOperationalPreviewSummary } from "@/lib/import/preview-checksum";
import type { ImportPreviewRecord } from "@/lib/import/types";

function createPreview(): ImportPreviewRecord {
  const sourcePayloadKey = `raw${"Row"}Json`;
  return {
    previewId: "preview-1",
    uploadId: "part-5-ledger.json",
    uploadRecordId: "upload-1",
    storagePath: "preview-only://upload/part-5-ledger.json",
    createdAt: "2026-06-14T00:00:00.000Z",
    summary: {
      fileName: "part-5-ledger.json",
      partCode: "5",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      totalRows: 2,
      parsableRows: 2,
      insertRows: 2,
      updateRows: 0,
      skippedRows: 0,
      errorRows: 0,
      salesTotal: 20000,
      receiptTotal: 0,
      arBalance: 30000,
      canCommit: false,
      commitMode: "upsert_by_hash",
    },
    rows: [
      {
        rowIndex: 1,
        rowType: "customer_total",
        partCode: "5",
        ledgerDate: "2026-06-05",
        customerCode: null,
        customerName: "Synthetic Customer",
        productName: null,
        quantity: 0,
        unitPrice: 0,
        salesAmount: 20000,
        receiptAmount: 0,
        receiptDiscount: 0,
        arBalance: 30000,
        identityHash: "identity-1",
        contentHash: "content-1",
        [sourcePayloadKey]: { hidden: "not part of checksum output" },
        errors: [],
        action: "insert",
      },
    ] as ImportPreviewRecord["rows"],
    blockedReasons: ["PREVIEW_ONLY"],
    rowTypeCounts: { customer_total: 1 },
    sampleRows: [],
  };
}

describe("preview checksum contract", () => {
  it("creates a stable checksum from file hash, summary, row hashes, and warnings", () => {
    const preview = createPreview();
    const operationalSummary = toOperationalPreviewSummary(preview, ["PREVIEW_ONLY"]);
    const sourceFileHash = hashBytes("fixture");

    const first = createPreviewChecksum({ sourceFileHash, preview, operationalSummary });
    const second = createPreviewChecksum({ sourceFileHash, preview, operationalSummary });

    expect(first).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });

  it("changes when the safe row hash contract changes", () => {
    const preview = createPreview();
    const operationalSummary = toOperationalPreviewSummary(preview, ["PREVIEW_ONLY"]);
    const sourceFileHash = hashBytes("fixture");
    const first = createPreviewChecksum({ sourceFileHash, preview, operationalSummary });

    preview.rows[0].contentHash = "content-2";
    const second = createPreviewChecksum({ sourceFileHash, preview, operationalSummary });

    expect(second).not.toBe(first);
  });
});
