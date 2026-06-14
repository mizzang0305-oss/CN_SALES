import { NextResponse } from "next/server";
import { createOperatorPreviewImportService, createPreviewImportService, parseRowsFromJson } from "@/lib/import/service-factory";
import { extractPartCodeFromText, getSelectedFilePartMismatch, normalizePartCode } from "@/lib/import/master-data";
import type { ImportPreviewRecord } from "@/lib/import/types";

export const runtime = "nodejs";
const invalidUploadMessage = "업로드 파일을 읽을 수 없습니다. 파일 형식과 양식을 확인해 주세요.";
type PreviewInputRow = Record<string, string | number | null>;
type PreviewServiceStatus = {
  mode: string;
  canWrite?: boolean;
  blockedReasons: string[];
};

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

function toSafePreviewResponse(preview: ImportPreviewRecord, status: PreviewServiceStatus) {
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

  const operationalSummary = toOperationalPreviewSummary(preview, status.blockedReasons);
  const applyReason = getApplyDisabledReason(preview, status, operationalSummary.partMismatch);

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
    operationalSummary,
    mode: status.mode,
    blocked_reasons: status.blockedReasons,
    apply: {
      enabled: !applyReason,
      reason: applyReason ?? "OPERATOR_CONFIRMATION_REQUIRED",
    },
  };
}

function toOperationalPreviewSummary(preview: ImportPreviewRecord, envBlockedReasons: string[]) {
  const customerNames = new Set(preview.rows.map((row) => row.customerName?.trim()).filter(Boolean));
  const productNames = new Set(preview.rows.map((row) => row.productName?.trim()).filter(Boolean));
  const partMismatch = getSelectedFilePartMismatch({
    selectedPartCode: preview.summary.partCode,
    fileName: preview.summary.fileName,
  });
  const warnings = uniqueStrings([
    ...preview.blockedReasons,
    ...envBlockedReasons,
    ...(partMismatch ? [partMismatch.code] : []),
    ...(preview.summary.errorRows > 0 ? ["PREVIEW_HAS_ERROR_ROWS"] : []),
    ...(preview.summary.skippedRows > 0 ? ["DUPLICATE_OR_SKIPPED_ROWS_PRESENT"] : []),
  ]);

  return {
    totalRows: preview.summary.totalRows,
    normalRows: Math.max(preview.summary.parsableRows - preview.summary.errorRows, 0),
    excludedOrErrorRows: preview.summary.skippedRows + preview.summary.errorRows,
    partMismatch: Boolean(partMismatch),
    selectedPartCode: preview.summary.partCode,
    filePartCode: partMismatch?.filePartCode ?? extractPartCodeFromText(preview.summary.fileName),
    amountTotal: preview.summary.salesTotal + preview.summary.receiptTotal,
    salesTotal: preview.summary.salesTotal,
    receiptTotal: preview.summary.receiptTotal,
    customerCount: customerNames.size,
    productCount: productNames.size,
    warnings,
  };
}

function getApplyDisabledReason(preview: ImportPreviewRecord, status: PreviewServiceStatus, partMismatch: boolean) {
  if (partMismatch) return "PART_FILE_MISMATCH";
  if (!status.canWrite) return "PREVIEW_ONLY";
  if (!preview.summary.canCommit) return "PREVIEW_NOT_COMMITTABLE";
  return null;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
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
      const { status, service } = await createOperatorPreviewImportService();
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
    return invalidUploadResponse(error instanceof SyntaxError ? 400 : 415);
  }
}
