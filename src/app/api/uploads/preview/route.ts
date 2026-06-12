import { NextResponse } from "next/server";
import { createPreviewImportService, parseRowsFromJson } from "@/lib/import/service-factory";
import { extractPartCodeFromText, normalizePartCode } from "@/lib/import/master-data";
import type { ImportPreviewRecord } from "@/lib/import/types";

export const runtime = "nodejs";
const invalidUploadMessage = "업로드 파일을 읽을 수 없습니다. 파일 형식과 양식을 확인해 주세요.";
type PreviewInputRow = Record<string, string | number | null>;

function logPreviewEvent(event: string, details: Record<string, unknown>) {
  console.info(`[uploads.preview] ${event}`, details);
}

function invalidUploadResponse(status = 422) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INVALID_UPLOAD_FILE",
        message: invalidUploadMessage,
      },
    },
    { status },
  );
}

function isSupportedPreviewFile(fileName: string) {
  return /\.(xls|xlsx|json)$/i.test(fileName);
}

function toSafePreviewResponse(preview: ImportPreviewRecord, status: { mode: string; blockedReasons: string[] }) {
  const rows = preview.rows.map((row) => ({
    rowKey: `${row.rowIndex}:${row.rowType}:${row.ledgerDate}:${row.customerCode ?? ""}:${row.customerName ?? ""}:${row.productName ?? ""}`,
    rowIndex: row.rowIndex,
    rowType: row.rowType,
    partCode: row.partCode,
    ledgerDate: row.ledgerDate,
    customerCode: row.customerCode,
    customerName: row.customerName,
    productName: row.productName,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    salesAmount: row.salesAmount,
    receiptAmount: row.receiptAmount,
    receiptDiscount: row.receiptDiscount,
    arBalance: row.arBalance,
    errors: row.errors,
    action: row.action,
  }));

  return {
    ok: true,
    previewId: preview.previewId,
    uploadId: preview.uploadId,
    uploadRecordId: preview.uploadRecordId,
    summary: preview.summary,
    rows,
    sampleRows: rows.slice(0, 20),
    blockedReasons: preview.blockedReasons,
    rowTypeCounts: preview.rowTypeCounts,
    mode: status.mode,
    blocked_reasons: status.blockedReasons,
    apply: {
      enabled: false,
      reason: "PREVIEW_ONLY",
    },
  };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "file_required", blocked_reasons: ["Upload file is required."] }, { status: 400 });
      }

      if (!isSupportedPreviewFile(file.name)) {
        logPreviewEvent("failed", { code: "INVALID_UPLOAD_FILE", normalizedTableWrite: false });
        return invalidUploadResponse(415);
      }

      const selectedPartCode = normalizePartCode(String(formData.get("partCode") ?? formData.get("selectedPart") ?? "1"));
      const filePartCode = extractPartCodeFromText(file.name);
      const { status, service } = await createPreviewImportService();
      logPreviewEvent("start", {
        requestMode: "file",
        serviceMode: status.mode,
        fileName: file.name,
        selectedPartCode,
        filePartCode: filePartCode || null,
        partMismatch: Boolean(filePartCode && selectedPartCode && filePartCode !== selectedPartCode),
      });
      const preview = await service.preview({
        file,
        partCode: selectedPartCode,
        periodStart: String(formData.get("periodStart") ?? "2026-06-01"),
        periodEnd: String(formData.get("periodEnd") ?? "2026-06-30"),
      });
      logPreviewEvent("complete", {
        requestMode: "file",
        serviceMode: status.mode,
        parserCalled: true,
        storageSaved: true,
        previewRecordCreated: Boolean(preview.previewId),
        normalizedTableWrite: false,
        totalRows: preview.summary.totalRows,
        errorRows: preview.summary.errorRows,
        canCommit: preview.summary.canCommit,
      });

      return NextResponse.json(toSafePreviewResponse(preview, status));
    }

    const body = (await request.json()) as {
      fileName?: string;
      partCode?: string;
      periodStart?: string;
      periodEnd?: string;
      rows?: PreviewInputRow[];
    };
    const file = new File([JSON.stringify(body.rows ?? [])], body.fileName ?? "ledger.json", {
      type: "application/json",
    });
    const selectedPartCode = normalizePartCode(body.partCode ?? "1");
    const filePartCode = extractPartCodeFromText(file.name);
    const { status, service } = await createPreviewImportService(parseRowsFromJson(body.rows ?? []));
    logPreviewEvent("start", {
      requestMode: "fixture",
      serviceMode: status.mode,
      fileName: file.name,
      selectedPartCode,
      filePartCode: filePartCode || null,
      partMismatch: Boolean(filePartCode && selectedPartCode && filePartCode !== selectedPartCode),
    });
    const preview = await service.preview({
      file,
      partCode: selectedPartCode,
      periodStart: body.periodStart ?? "2026-06-01",
      periodEnd: body.periodEnd ?? "2026-06-30",
    });
    logPreviewEvent("complete", {
      requestMode: "fixture",
      serviceMode: status.mode,
      parserCalled: false,
      storageSaved: true,
      previewRecordCreated: Boolean(preview.previewId),
      normalizedTableWrite: false,
      totalRows: preview.summary.totalRows,
      errorRows: preview.summary.errorRows,
      canCommit: preview.summary.canCommit,
    });

    return NextResponse.json(toSafePreviewResponse(preview, status));
  } catch (error) {
    logPreviewEvent("failed", {
      normalizedTableWrite: false,
      code: "INVALID_UPLOAD_FILE",
    });
    return invalidUploadResponse(error instanceof SyntaxError ? 400 : 422);
  }
}
