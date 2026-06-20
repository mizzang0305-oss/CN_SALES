import { NextResponse } from "next/server";
import { extractPartCodeFromText, normalizePartCode } from "@/lib/import/master-data";
import { hashUploadFile, toOperationalPreviewSummary } from "@/lib/import/preview-checksum";
import { createPreviewOnlyImportService } from "@/lib/import/service-factory";
import { parseManagedPartCodes, validateSalesPartAccess } from "@/lib/auth/part-access";
import {
  createSalesImportPreviewResponse,
  deriveSalesImportPreviewPeriod,
  isSupportedSalesImportPreviewFile,
  resolveSalesImportPreviewPart,
} from "@/lib/web-import/sales-preview";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return salesImportPreviewError(415, "MULTIPART_FORM_REQUIRED", "Use multipart/form-data with a file field.");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return salesImportPreviewError(400, "UPLOAD_FILE_REQUIRED", "An XLS or XLSX file is required.");
    }

    if (!isSupportedSalesImportPreviewFile(file.name, { allowJsonFixture: process.env.NODE_ENV === "test" })) {
      return salesImportPreviewError(415, "INVALID_UPLOAD_FILE", "Only XLS and XLSX files are accepted for preview.");
    }

    const role = getTextInput(request, formData, "x-cn-sales-role", "role", "salesRole");
    const managedParts = parseManagedPartCodes(getTextInput(request, formData, "x-cn-sales-managed-parts", "managedParts", "leadManagedParts"));
    const selectedPartCode = normalizePartCode(getFormText(formData, "partCode", "selectedPart", "part"));
    const filePartCode = extractPartCodeFromText(file.name);
    const preflightPart = filePartCode || selectedPartCode;

    if (preflightPart) {
      const access = validateSalesPartAccess({ role, partCode: preflightPart, managedParts });
      if (!access.ok) return forbiddenPreviewResponse(access.blockedReasons, access.allowedParts);
    }

    const period = deriveSalesImportPreviewPeriod({
      fileName: file.name,
      periodStart: getFormText(formData, "periodStart"),
      periodEnd: getFormText(formData, "periodEnd"),
      periodMonth: getFormText(formData, "periodMonth"),
    });
    const { sourceFileHash } = await hashUploadFile(file);
    const { status, service } = await createPreviewOnlyImportService();
    const preview = await service.preview({
      file,
      partCode: selectedPartCode,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    });
    const operationalSummary = toOperationalPreviewSummary(preview, status.blockedReasons);
    const resolvedPart = resolveSalesImportPreviewPart({
      selectedPartCode,
      fileName: file.name,
      preview,
      operationalSummary,
    });
    const access = validateSalesPartAccess({
      role,
      partCode: resolvedPart.part,
      managedParts,
    });

    if (!access.ok) return forbiddenPreviewResponse(access.blockedReasons, access.allowedParts);

    return NextResponse.json(
      createSalesImportPreviewResponse({
        preview,
        operationalSummary,
        fileHash: sourceFileHash,
        access,
        selectedPart: resolvedPart.selectedPart,
        filePart: resolvedPart.filePart,
      }),
    );
  } catch {
    return salesImportPreviewError(415, "INVALID_UPLOAD_FILE", "The uploaded file could not be parsed safely.");
  }
}

function getTextInput(request: Request, formData: FormData, headerName: string, ...fieldNames: string[]) {
  return request.headers.get(headerName) ?? getFormText(formData, ...fieldNames);
}

function getFormText(formData: FormData, ...fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    const value = formData.get(fieldName);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function forbiddenPreviewResponse(blockedReasons: string[], allowedParts: string[]) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: blockedReasons[0] ?? "PART_SCOPE_FORBIDDEN",
        message: "The selected role is not allowed to preview this part.",
      },
      blockedReasons,
      allowedParts,
      rawRowsReturned: false,
      sideEffects: noPreviewSideEffects(),
    },
    { status: 403 },
  );
}

function salesImportPreviewError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
      blockedReasons: [code],
      rawRowsReturned: false,
      sideEffects: noPreviewSideEffects(),
    },
    { status },
  );
}

function noPreviewSideEffects() {
  return {
    dbWrite: false,
    storageWrite: false,
    sync: false,
    apply: false,
  } as const;
}
