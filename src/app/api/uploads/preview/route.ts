import { NextResponse } from "next/server";
import { createImportService, parseRowsFromJson } from "@/lib/import/service-factory";
import { extractPartCodeFromText, normalizePartCode } from "@/lib/import/master-data";
import type { LedgerRawRow } from "@/lib/types";

export const runtime = "nodejs";

function logPreviewEvent(event: string, details: Record<string, unknown>) {
  console.info(`[uploads.preview] ${event}`, details);
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

      const selectedPartCode = normalizePartCode(String(formData.get("partCode") ?? "1"));
      const filePartCode = extractPartCodeFromText(file.name);
      const { status, service } = await createImportService();
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

      return NextResponse.json({ ...preview, mode: status.mode, blocked_reasons: status.blockedReasons });
    }

    const body = (await request.json()) as {
      fileName?: string;
      partCode?: string;
      periodStart?: string;
      periodEnd?: string;
      rows?: LedgerRawRow[];
    };
    const file = new File([JSON.stringify(body.rows ?? [])], body.fileName ?? "ledger.json", {
      type: "application/json",
    });
    const selectedPartCode = normalizePartCode(body.partCode ?? "1");
    const filePartCode = extractPartCodeFromText(file.name);
    const { status, service } = await createImportService(parseRowsFromJson(body.rows ?? []));
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

    return NextResponse.json({ ...preview, mode: status.mode, blocked_reasons: status.blockedReasons });
  } catch (error) {
    logPreviewEvent("failed", {
      normalizedTableWrite: false,
      message: error instanceof Error ? error.message : "Preview failed.",
    });
    return NextResponse.json(
      {
        error: "preview_failed",
        blocked_reasons: [error instanceof Error ? error.message : "Preview failed."],
      },
      { status: 500 },
    );
  }
}
