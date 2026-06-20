import { describe, expect, it, vi } from "vitest";
import { POST as salesPreviewPost } from "@/app/api/sales-import/preview/route";
import {
  createSalesImportPreviewResponse,
  deriveSalesImportPreviewPeriod,
  validateSalesImportPreviewAccess,
} from "@/lib/web-import/sales-preview";
import type { OperationalPreviewSummary } from "@/lib/import/preview-checksum";
import type { ImportPreviewRecord } from "@/lib/import/types";

vi.mock("server-only", () => ({}));

const jsonRows = [
  {
    date: "2026-06-05",
    row_type: "customer_total",
    part: "1",
    customer_name: "Synthetic Customer A",
    sales_amount: 20000,
    ar_balance: 30000,
  },
  {
    date: "2026-06-05",
    row_type: "item_detail",
    part: "1",
    customer_name: "Synthetic Customer A",
    product_name: "Synthetic Product A",
    quantity: 2,
    unit_price: 10000,
    sales_amount: 20000,
  },
];

describe("sales import preview access policy", () => {
  it("allows assigned sales reps and blocks cross-part previews", () => {
    expect(validateSalesImportPreviewAccess({ role: "SALES_REP_PART_1", partCode: "1" })).toMatchObject({
      ok: true,
      allowedParts: ["1"],
    });
    expect(validateSalesImportPreviewAccess({ role: "SALES_REP_PART_1", partCode: "4" })).toMatchObject({
      ok: false,
      blockedReasons: ["PART_SCOPE_FORBIDDEN"],
    });
  });

  it("allows admins for every supported part and part leads only for managed parts", () => {
    expect(validateSalesImportPreviewAccess({ role: "ADMIN", partCode: "11" })).toMatchObject({
      ok: true,
      allowedParts: ["1", "4", "5", "6", "7", "9", "10", "11"],
    });
    expect(validateSalesImportPreviewAccess({ role: "PART_LEAD", partCode: "4", managedParts: ["1", "4"] })).toMatchObject({
      ok: true,
      allowedParts: ["1", "4"],
    });
    expect(validateSalesImportPreviewAccess({ role: "PART_LEAD", partCode: "11", managedParts: ["1", "4"] })).toMatchObject({
      ok: false,
      blockedReasons: ["PART_SCOPE_FORBIDDEN"],
    });
  });
});

describe("sales import preview aggregate contract", () => {
  it("derives filename periods without returning row payloads", () => {
    expect(
      deriveSalesImportPreviewPeriod({
        fileName: "4\uD30C\uD2B8 1-6\uC77C \uB9E4\uCD9C\uD604\uD669.XLS",
        periodMonth: "2026-06",
      }),
    ).toEqual({ periodStart: "2026-06-01", periodEnd: "2026-06-06" });
  });

  it("creates a flat aggregate-only response", () => {
    const access = validateSalesImportPreviewAccess({ role: "ADMIN", partCode: "4" });
    const response = createSalesImportPreviewResponse({
      preview: fakePreview(),
      operationalSummary: fakeOperationalSummary(),
      fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      access,
      selectedPart: "",
      filePart: "4",
    });
    const text = JSON.stringify(response);

    expect(response).toMatchObject({
      ok: true,
      fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      part: "4",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      normalRows: 2,
      excludedRows: 0,
      amountTotal: 20000,
      warningRows: 0,
      errorRows: 0,
      rawRowsReturned: false,
      sideEffects: {
        dbWrite: false,
        storageWrite: false,
        sync: false,
        apply: false,
      },
    });
    expect(text).not.toContain("\"rows\"");
    expect(text).not.toContain("customer_name");
    expect(text).not.toContain("Synthetic Customer");
    expect(text).not.toContain("Synthetic Product");
  });
});

describe("sales import preview API", () => {
  it("returns aggregate-only preview results without DB or storage writes", async () => {
    const formData = new FormData();
    formData.set("file", new File([JSON.stringify(jsonRows)], "1-part-sales-preview.json", { type: "application/json" }));
    formData.set("role", "SALES_REP_PART_1");
    formData.set("periodStart", "2026-06-01");
    formData.set("periodEnd", "2026-06-06");

    const response = await salesPreviewPost(new Request("http://localhost/api/sales-import/preview", { method: "POST", body: formData }));
    const text = await response.text();
    const body = JSON.parse(text) as {
      ok: boolean;
      fileHash: string;
      part: string;
      normalRows: number;
      excludedRows: number;
      amountTotal: number;
      warningRows: number;
      errorRows: number;
      rawRowsReturned: false;
      sideEffects: { dbWrite: boolean; storageWrite: boolean; sync: boolean; apply: boolean };
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      part: "1",
      normalRows: 2,
      excludedRows: 0,
      amountTotal: 20000,
      warningRows: 0,
      errorRows: 0,
      rawRowsReturned: false,
      sideEffects: { dbWrite: false, storageWrite: false, sync: false, apply: false },
    });
    expect(body.fileHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(text).not.toContain("\"rows\"");
    expect(text).not.toContain("Synthetic Customer");
    expect(text).not.toContain("Synthetic Product");
  });

  it("blocks cross-part sales reps before returning preview aggregates", async () => {
    const formData = new FormData();
    formData.set("file", new File([JSON.stringify(jsonRows)], "part-4-sales-preview.json", { type: "application/json" }));
    formData.set("role", "SALES_REP_PART_1");

    const response = await salesPreviewPost(new Request("http://localhost/api/sales-import/preview", { method: "POST", body: formData }));
    const text = await response.text();

    expect(response.status).toBe(403);
    expect(text).toContain("PART_SCOPE_FORBIDDEN");
    expect(text).not.toContain("normalRows");
    expect(text).not.toContain("Synthetic Customer");
  });

  it("blocks missing and unsupported files", async () => {
    const missing = await salesPreviewPost(new Request("http://localhost/api/sales-import/preview", { method: "POST", body: new FormData() }));
    expect(missing.status).toBe(400);
    expect(await missing.text()).toContain("UPLOAD_FILE_REQUIRED");

    const formData = new FormData();
    formData.set("file", new File(["plain text"], "part-1.txt", { type: "text/plain" }));
    formData.set("role", "ADMIN");

    const invalid = await salesPreviewPost(new Request("http://localhost/api/sales-import/preview", { method: "POST", body: formData }));
    expect(invalid.status).toBe(415);
    expect(await invalid.text()).toContain("INVALID_UPLOAD_FILE");
  });
});

function fakePreview(): ImportPreviewRecord {
  return {
    previewId: "preview-id",
    uploadId: "upload-id",
    uploadRecordId: "upload-record-id",
    storagePath: "preview-only://file",
    summary: {
      fileName: "4-part-sales-preview.xlsx",
      partCode: "4",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      totalRows: 2,
      parsableRows: 2,
      insertRows: 2,
      updateRows: 0,
      skippedRows: 0,
      excludedRows: 0,
      warningRows: 0,
      errorRows: 0,
      excludedByReason: {},
      warningByReason: {},
      errorByReason: {},
      salesTotal: 20000,
      receiptTotal: 0,
      arBalance: 30000,
      canCommit: false,
      commitMode: "preview_only",
    },
    rows: [],
    blockedReasons: ["PREVIEW_ONLY"],
    rowTypeCounts: { customer_total: 1, item_detail: 1 },
    sampleRows: [],
  };
}

function fakeOperationalSummary(): OperationalPreviewSummary {
  return {
    totalRows: 2,
    normalRows: 2,
    excludedRows: 0,
    warningRows: 0,
    errorRows: 0,
    excludedOrErrorRows: 0,
    excludedByReason: {},
    warningByReason: {},
    errorByReason: {},
    partMismatch: false,
    selectedPartCode: "4",
    filePartCode: "4",
    amountTotal: 20000,
    salesTotal: 20000,
    receiptTotal: 0,
    customerCount: 1,
    productCount: 1,
    warnings: ["PREVIEW_ONLY"],
  };
}
