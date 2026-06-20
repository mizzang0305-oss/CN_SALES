import { NextResponse } from "next/server";
import { isCommittablePreviewRow } from "@/lib/import/row-classification";
import { readExistingLedgerRowsForSync } from "@/lib/import/sync-existing-reader";
import { deriveLedgerSyncScope, planLedgerSyncDiff } from "@/lib/import/sync-diff";
import { createLedgerSyncRows } from "@/lib/import/sync-key";
import { hashUploadFile, toOperationalPreviewSummary } from "@/lib/import/preview-checksum";
import { createPreviewOnlyImportService } from "@/lib/import/service-factory";
import { parseManagedPartCodes, validateSalesPartAccess } from "@/lib/auth/part-access";
import {
  createSalesImportDryRunResponse,
  sumLedgerSyncAmount,
  validateSalesImportDryRunContract,
  type SalesImportDryRunContractInput,
} from "@/lib/web-import/sales-dry-run";
import {
  deriveSalesImportFilenamePeriod,
  deriveSalesImportPreviewPeriod,
  isSupportedSalesImportPreviewFile,
  resolveSalesImportPreviewPart,
} from "@/lib/web-import/sales-preview";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return dryRunError(415, "MULTIPART_FORM_REQUIRED", "Use multipart/form-data with the same previewed file.");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return dryRunError(400, "UPLOAD_FILE_REQUIRED", "The same previewed XLS or XLSX file is required.");
    }

    if (!isSupportedSalesImportPreviewFile(file.name, { allowJsonFixture: process.env.NODE_ENV === "test" })) {
      return dryRunError(415, "INVALID_UPLOAD_FILE", "Only XLS and XLSX files are accepted for dry-run.");
    }

    const role = getTextInput(request, formData, "x-cn-sales-role", "role", "salesRole");
    const managedParts = parseManagedPartCodes(getTextInput(request, formData, "x-cn-sales-managed-parts", "managedParts", "leadManagedParts"));
    const contract = readDryRunContract(formData);
    const filenamePeriod = deriveSalesImportFilenamePeriod({ fileName: file.name, periodMonth: getFormText(formData, "periodMonth") });
    if (
      filenamePeriod &&
      contract.periodStart &&
      contract.periodEnd &&
      (contract.periodStart !== filenamePeriod.periodStart || contract.periodEnd !== filenamePeriod.periodEnd)
    ) {
      return dryRunError(409, "PERIOD_MISMATCH", "The requested period does not match the file name period.");
    }

    const preflightAccess = contract.part
      ? validateSalesPartAccess({ role, partCode: contract.part, managedParts })
      : null;
    if (preflightAccess && !preflightAccess.ok) return forbiddenDryRunResponse(preflightAccess.blockedReasons, preflightAccess.allowedParts);

    const period = deriveSalesImportPreviewPeriod({
      fileName: file.name,
      periodStart: contract.periodStart,
      periodEnd: contract.periodEnd,
      periodMonth: getFormText(formData, "periodMonth"),
    });
    const { sourceFileHash } = await hashUploadFile(file);
    const { status, service } = await createPreviewOnlyImportService();
    const preview = await service.preview({
      file,
      partCode: contract.part ?? "",
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    });
    const operationalSummary = toOperationalPreviewSummary(preview, status.blockedReasons);
    const resolvedPart = resolveSalesImportPreviewPart({
      selectedPartCode: contract.part,
      fileName: file.name,
      preview,
      operationalSummary,
    });
    const access = validateSalesPartAccess({ role, partCode: resolvedPart.part, managedParts });
    if (!access.ok) return forbiddenDryRunResponse(access.blockedReasons, access.allowedParts);

    const contractValidation = validateSalesImportDryRunContract({
      expected: contract,
      actual: {
        fileHash: sourceFileHash,
        part: resolvedPart.part,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        operationalSummary,
      },
    });
    if (!contractValidation.ok) {
      return dryRunError(409, "PREVIEW_CONTRACT_MISMATCH", "The dry-run request does not match the preview summary.", {
        blockedReasons: contractValidation.blockedReasons,
      });
    }

    const committableRows = preview.rows.filter(isCommittablePreviewRow);
    const syncScope = deriveLedgerSyncScope({
      partCode: resolvedPart.part,
      dates: committableRows.map((row) => row.ledgerDate),
      fallbackDateFrom: period.periodStart,
      fallbackDateTo: period.periodEnd,
      explicitDateFrom: period.periodStart,
      explicitDateTo: period.periodEnd,
    });
    const existingRead = await readExistingLedgerRowsForSync(syncScope);
    const incomingSyncRows = createLedgerSyncRows(committableRows);
    const syncDiff = planLedgerSyncDiff({
      scope: syncScope,
      incomingRows: incomingSyncRows,
      existingRows: existingRead.rows,
      incomingSummary: {
        normalRows: operationalSummary.normalRows,
        excludedRows: operationalSummary.excludedRows,
        warningRows: operationalSummary.warningRows,
        errorRows: operationalSummary.errorRows,
      },
      readOnlyEvidence: {
        readExecuted: existingRead.readExecuted,
        readBlockedReason: existingRead.readBlockedReason,
        reader: existingRead.diagnostics,
      },
    });

    return NextResponse.json(createSalesImportDryRunResponse({
      fileHash: sourceFileHash,
      part: resolvedPart.part,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      operationalSummary,
      syncDiff,
      amountBefore: sumLedgerSyncAmount(existingRead.rows),
      access,
    }));
  } catch {
    return dryRunError(500, "SALES_IMPORT_DRY_RUN_FAILED", "Sales import dry-run failed safely.");
  }
}

function readDryRunContract(formData: FormData): SalesImportDryRunContractInput {
  return {
    fileHash: getFormText(formData, "fileHash", "sourceFileHash"),
    part: getFormText(formData, "part", "partCode", "selectedPart"),
    periodStart: getFormText(formData, "periodStart"),
    periodEnd: getFormText(formData, "periodEnd"),
    normalRows: getFormNumber(formData, "normalRows"),
    excludedRows: getFormNumber(formData, "excludedRows"),
    amountTotal: getFormNumber(formData, "amountTotal"),
    warningRows: getFormNumber(formData, "warningRows"),
    errorRows: getFormNumber(formData, "errorRows"),
  };
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

function getFormNumber(formData: FormData, fieldName: string) {
  const value = getFormText(formData, fieldName);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function forbiddenDryRunResponse(blockedReasons: string[], allowedParts: string[]) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: blockedReasons[0] ?? "PART_SCOPE_FORBIDDEN",
        message: "The selected role is not allowed to dry-run this part.",
      },
      blockedReasons,
      allowedParts,
      rawRowsReturned: false,
      sideEffects: noDryRunSideEffects(),
    },
    { status: 403 },
  );
}

function dryRunError(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
      blockedReasons: [code],
      rawRowsReturned: false,
      sideEffects: noDryRunSideEffects(),
      ...extra,
    },
    { status },
  );
}

function noDryRunSideEffects() {
  return {
    dbWrite: false,
    storageWrite: false,
    sync: false,
    apply: false,
    physicalDelete: false,
  } as const;
}
