import { NextResponse } from "next/server";
import { createPreviewOnlyImportService, parseRowsFromJson } from "@/lib/import/service-factory";
import { extractPartCodeFromText, normalizePartCode } from "@/lib/import/master-data";
import {
  createPreviewChecksum,
  getApplyDisabledReason,
  getConfirmBlockedReason,
  hashUploadFile,
  toOperationalPreviewSummary,
} from "@/lib/import/preview-checksum";
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

function toSafePreviewResponse(preview: ImportPreviewRecord, status: PreviewServiceStatus, sourceFileHash: string) {
  const sampleRows = preview.rows.slice(0, 20).map((row) => ({
    rowKey: `${row.rowIndex}:${row.rowType}`,
    rowIndex: row.rowIndex,
    rowType: row.rowType,
    partCode: row.partCode,
    ledgerDate: row.ledgerDate,
    errors: row.errors,
    action: row.action,
  }));

  const operationalSummary = toOperationalPreviewSummary(preview, status.blockedReasons);
  const applyReason = getApplyDisabledReason(preview, status, operationalSummary.partMismatch);
  const confirmBlockedReason = getConfirmBlockedReason(operationalSummary);

  return {
    ok: true,
    previewId: preview.previewId,
    uploadId: preview.uploadId,
    uploadRecordId: preview.uploadRecordId,
    summary: preview.summary,
    rows: [],
    sampleRows,
    blockedReasons: preview.blockedReasons,
    rowTypeCounts: preview.rowTypeCounts,
    operationalSummary,
    sourceFileHash,
    previewChecksum: createPreviewChecksum({ sourceFileHash, preview, operationalSummary }),
    confirmCandidate: !confirmBlockedReason,
    confirmBlockedReason,
    mode: status.mode,
    blocked_reasons: status.blockedReasons,
    apply: {
      enabled: !applyReason,
      reason: applyReason ?? "OPERATOR_CONFIRMATION_REQUIRED",
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

      const { sourceFileHash } = await hashUploadFile(file);
      const selectedPartCode = normalizePartCode(String(formData.get("partCode") ?? formData.get("selectedPart") ?? "1"));
      const filePartCode = extractPartCodeFromText(file.name);
      const { status, service } = await createPreviewOnlyImportService();
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
        storageSaved: false,
        previewRecordCreated: false,
        previewOnly: true,
        normalizedTableWrite: false,
        totalRows: preview.summary.totalRows,
        errorRows: preview.summary.errorRows,
        canCommit: preview.summary.canCommit,
      });

      return NextResponse.json(toSafePreviewResponse(preview, status, sourceFileHash));
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
    const { sourceFileHash } = await hashUploadFile(file);
    const selectedPartCode = normalizePartCode(body.partCode ?? "1");
    const filePartCode = extractPartCodeFromText(file.name);
    const { status, service } = await createPreviewOnlyImportService(parseRowsFromJson(body.rows ?? []));
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
      storageSaved: false,
      previewRecordCreated: false,
      previewOnly: true,
      normalizedTableWrite: false,
      totalRows: preview.summary.totalRows,
      errorRows: preview.summary.errorRows,
      canCommit: preview.summary.canCommit,
    });

    return NextResponse.json(toSafePreviewResponse(preview, status, sourceFileHash));
  } catch (error) {
    logPreviewEvent("failed", {
      normalizedTableWrite: false,
      code: "INVALID_UPLOAD_FILE",
    });
    return invalidUploadResponse(error instanceof SyntaxError ? 400 : 415);
  }
}
