import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { POST as previewPost } from "@/app/api/uploads/preview/route";
import { POST as confirmPost } from "@/app/api/uploads/confirm/route";

vi.mock("server-only", () => ({}));

const jsonRows = [
  {
    date: "2026-06-05",
    row_type: "customer_total",
    part: "5",
    customer_name: "Synthetic Customer A",
    sales_amount: 20000,
    ar_balance: 30000,
  },
  {
    date: "2026-06-05",
    row_type: "item_detail",
    part: "5",
    customer_name: "Synthetic Customer A",
    product_name: "Synthetic Product A",
    quantity: 2,
    unit_price: 10000,
    sales_amount: 20000,
  },
];

describe("upload preview route response safety", () => {
  it("returns a sanitized 4xx response for unsupported upload files", async () => {
    const formData = new FormData();
    formData.set("file", new File(["not an xlsx file\n"], "invalid_upload.txt", { type: "text/plain" }));
    formData.set("partCode", "5");

    const response = await previewPost(new Request("http://localhost/api/uploads/preview", { method: "POST", body: formData }));
    const text = await response.text();

    expect(response.status).toBe(415);
    expect(text).toContain("INVALID_UPLOAD_FILE");
    for (const fragment of forbiddenDiagnosticFragments()) {
      expect(text).not.toContain(fragment);
    }
  });

  it("does not expose source row payload fields in successful preview responses", async () => {
    const response = await previewPost(new Request("http://localhost/api/uploads/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "cn-sales-upload-preview-synthetic-part-5.json",
        partCode: "5",
        rows: jsonRows,
      }),
    }));
    const text = await response.text();
    const body = JSON.parse(text) as {
      rows: Array<Record<string, unknown>>;
      sampleRows: Array<Record<string, unknown>>;
      operationalSummary?: {
        totalRows: number;
        normalRows: number;
        excludedOrErrorRows: number;
        amountTotal: number;
        customerCount: number;
        productCount: number;
        warnings: string[];
      };
      apply?: { enabled?: boolean; reason?: string };
      mode?: string;
      blocked_reasons?: string[];
      sourceFileHash?: string;
      previewChecksum?: string;
      confirmCandidate?: boolean;
      confirmBlockedReason?: string | null;
    };

    expect(response.status).toBe(200);
    for (const fragment of forbiddenSourceRowFragments()) {
      expect(text).not.toContain(fragment);
    }
    expect(body.rows.length).toBe(0);
    expect(body.sampleRows.length).toBe(2);
    expect(body.sampleRows[0]).toHaveProperty("rowKey");
    expect(body.sampleRows[0]).not.toHaveProperty("identityHash");
    expect(body.sampleRows[0]).not.toHaveProperty("contentHash");
    expect(body.sampleRows[0]).not.toHaveProperty("customerName");
    expect(body.sampleRows[0]).not.toHaveProperty("productName");
    expect(body.apply?.enabled).toBe(false);
    expect(body.apply?.reason).toBe("PREVIEW_ONLY");
    expect(body.sourceFileHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(body.previewChecksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(body.confirmCandidate).toBe(true);
    expect(body.confirmBlockedReason).toBeNull();
    expect(body.mode).toBe("fixture");
    expect(body.blocked_reasons).toContain("PREVIEW_ONLY");
    expect(body.operationalSummary).toMatchObject({
      totalRows: 2,
      normalRows: 2,
      excludedOrErrorRows: 0,
      amountTotal: 20000,
      customerCount: 1,
      productCount: 1,
    });
  });

  it("does not create repo-local upload persistence during preview", async () => {
    const localDataPath = join(process.cwd(), ".local-data");
    const existedBefore = existsSync(localDataPath);

    await previewPost(new Request("http://localhost/api/uploads/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "cn-sales-upload-preview-synthetic-part-5.json",
        partCode: "5",
        rows: jsonRows,
      }),
    }));

    expect(existsSync(localDataPath)).toBe(existedBefore);
  });

  it("blocks confirm dry-run when DB apply is requested", async () => {
    const formData = await createConfirmFormData();
    formData.set("dryRun", "false");

    const response = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: formData }));
    const text = await response.text();

    expect(response.status).toBe(403);
    expect(text).toContain("APPLY_NOT_APPROVED");
    expect(text).not.toMatch(/inserted|updated|ledger_rows|sales_transactions/);
  });

  it("rejects confirm dry-run when the file is missing or unsupported", async () => {
    const missingFile = new FormData();
    missingFile.set("selectedPart", "5");
    missingFile.set("operator", "Test Operator");
    missingFile.set("ackPreviewReviewed", "true");
    missingFile.set("ackPartMatched", "true");
    missingFile.set("ackApplyRisk", "true");
    missingFile.set("sourceFileHash", "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    missingFile.set("previewChecksum", "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    missingFile.set("dryRun", "true");

    const missingResponse = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: missingFile }));
    expect(missingResponse.status).toBe(400);
    expect(await missingResponse.text()).toContain("UPLOAD_FILE_REQUIRED");

    const invalidFile = new FormData();
    invalidFile.set("file", new File(["invalid"], "part-5-ledger.txt", { type: "text/plain" }));
    invalidFile.set("selectedPart", "5");
    invalidFile.set("operator", "Test Operator");
    invalidFile.set("ackPreviewReviewed", "true");
    invalidFile.set("ackPartMatched", "true");
    invalidFile.set("ackApplyRisk", "true");
    invalidFile.set("sourceFileHash", "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    invalidFile.set("previewChecksum", "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    invalidFile.set("dryRun", "true");

    const invalidResponse = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: invalidFile }));
    const text = await invalidResponse.text();
    expect(invalidResponse.status).toBe(415);
    expect(text).toContain("INVALID_UPLOAD_FILE");
    for (const fragment of forbiddenDiagnosticFragments()) {
      expect(text).not.toContain(fragment);
    }
  });

  it("requires an operator and acknowledgements for confirm dry-run", async () => {
    const missingOperator = await createConfirmFormData();
    missingOperator.set("operator", "");
    const operatorResponse = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: missingOperator }));
    expect(operatorResponse.status).toBe(400);
    expect(await operatorResponse.text()).toContain("OPERATOR_REQUIRED");

    const missingAck = await createConfirmFormData();
    missingAck.set("ackApplyRisk", "false");
    const ackResponse = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: missingAck }));
    expect(ackResponse.status).toBe(400);
    expect(await ackResponse.text()).toContain("OPERATOR_CONFIRMATION_REQUIRED");
  });

  it("rejects confirm dry-run when the source file hash or checksum does not match", async () => {
    const hashMismatch = await createConfirmFormData();
    hashMismatch.set("sourceFileHash", "sha256:0000000000000000000000000000000000000000000000000000000000000000");
    const hashResponse = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: hashMismatch }));
    expect(hashResponse.status).toBe(409);
    expect(await hashResponse.text()).toContain("SOURCE_FILE_HASH_MISMATCH");

    const checksumMismatch = await createConfirmFormData();
    checksumMismatch.set("previewChecksum", "sha256:0000000000000000000000000000000000000000000000000000000000000000");
    const checksumResponse = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: checksumMismatch }));
    expect(checksumResponse.status).toBe(409);
    expect(await checksumResponse.text()).toContain("PREVIEW_CHECKSUM_MISMATCH");
  });

  it("rejects confirm dry-run when the selected part does not match the file part", async () => {
    const formData = await createConfirmFormData();
    formData.set("selectedPart", "1");

    const response = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: formData }));
    const text = await response.text();

    expect(response.status).toBe(409);
    expect(text).toContain("PART_FILE_MISMATCH");
  });

  it("returns a safe dry-run report without normalized table writes", async () => {
    const formData = await createConfirmFormData();

    const response = await confirmPost(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: formData }));
    const text = await response.text();
    const body = JSON.parse(text) as {
      ok: boolean;
      dryRun: boolean;
      applyReady: boolean;
      report: { expected_affected_rows: number; status: string };
      side_effects: { dbWrite: boolean; storageWrite: boolean; normalizedTableWrite: boolean; actualApply: boolean };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.dryRun).toBe(true);
    expect(body.applyReady).toBe(true);
    expect(body.report.expected_affected_rows).toBeGreaterThan(0);
    expect(body.side_effects).toEqual({
      dbWrite: false,
      storageWrite: false,
      normalizedTableWrite: false,
      actualApply: false,
    });
    for (const fragment of forbiddenSourceRowFragments()) {
      expect(text).not.toContain(fragment);
    }
  });
});

function forbiddenDiagnosticFragments() {
  return [
    "Trace" + "back",
    "sta" + "ck",
    "parser" + "." + "py",
    "open" + "pyxl",
    "C:" + "\\" + "Users",
    "/" + "Users" + "/",
    "/" + "tmp" + "/",
  ];
}

function forbiddenSourceRowFragments() {
  return [
    "raw" + "Row" + "Json",
    "raw" + "Rows",
    "raw" + "Row",
    "raw" + "_row",
    "raw" + " rows",
    "source" + "Raw" + "Row",
    "original" + "Row" + "Json",
  ];
}

async function createConfirmFormData() {
  const file = new File([JSON.stringify(jsonRows)], "part-5-ledger.json", { type: "application/json" });
  const previewFormData = new FormData();
  previewFormData.set("file", file);
  previewFormData.set("selectedPart", "5");
  const previewResponse = await previewPost(new Request("http://localhost/api/uploads/preview", { method: "POST", body: previewFormData }));
  const preview = (await previewResponse.json()) as {
    sourceFileHash: string;
    previewChecksum: string;
  };

  const formData = new FormData();
  formData.set("file", file);
  formData.set("selectedPart", "5");
  formData.set("operator", "Test Operator");
  formData.set("ackPreviewReviewed", "true");
  formData.set("ackPartMatched", "true");
  formData.set("ackApplyRisk", "true");
  formData.set("sourceFileHash", preview.sourceFileHash);
  formData.set("previewChecksum", preview.previewChecksum);
  formData.set("dryRun", "true");
  return formData;
}
