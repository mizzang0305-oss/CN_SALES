import { NextResponse } from "next/server";
import { createImportService, createPreviewOnlyImportService } from "@/lib/import/service-factory";
import {
  isLimitedApplyStage,
  loadLimitedApplyApproval,
  selectLimitedApplyRows,
  validateLimitedApplyPreconditions,
} from "@/lib/import/limited-apply";
import { extractPartCodeFromText, normalizePartCode } from "@/lib/import/master-data";
import { createPreviewChecksum, hashUploadFile, toOperationalPreviewSummary } from "@/lib/import/preview-checksum";
import { isCommittablePreviewRow } from "@/lib/import/row-classification";
import { SupabaseImportRepository } from "@/lib/import/supabase-repository";
import { readExistingLedgerRowsForSync } from "@/lib/import/sync-existing-reader";
import { deriveLedgerSyncScope, planLedgerSyncDiff, summarizeDuplicateSyncKeys } from "@/lib/import/sync-diff";
import { createLedgerIdentitySyncRows, createLedgerSyncRows } from "@/lib/import/sync-key";

export const runtime = "nodejs";

const applyNotApprovedMessage = "DB apply is not approved in this stage. Only confirm dry-run is available.";
const invalidUploadMessage = "The uploaded file could not be read. Check the file format and try again.";

function safeError(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    {
      ok: false,
      dryRun: true,
      error: { code, message },
      blocked_reasons: [code],
      dryRunReady: false,
      actualApplyReady: false,
      actualApplyBlockedReason: "APPLY_NOT_APPROVED",
      ...extra,
    },
    { status },
  );
}

function applyNotApprovedResponse() {
  return safeError(403, "APPLY_NOT_APPROVED", applyNotApprovedMessage, {
    applyReady: false,
    dryRunReady: false,
    actualApplyReady: false,
    actualApplyBlockedReason: "APPLY_NOT_APPROVED",
  });
}

function isSupportedUploadFile(fileName: string) {
  return /\.(xls|xlsx|json)$/i.test(fileName);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return false;
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

function getNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function missingAcknowledgements(formData: FormData) {
  const missing: string[] = [];
  if (!getBoolean(formData, "ackPreviewReviewed")) missing.push("ackPreviewReviewed");
  if (!getBoolean(formData, "ackPartMatched")) missing.push("ackPartMatched");
  if (!getBoolean(formData, "ackApplyRisk")) missing.push("ackApplyRisk");
  return missing;
}

function getLimitedApplySafeCode(value: unknown) {
  if (!(value instanceof Error)) return null;
  const message = value["message"];
  return typeof message === "string" && message.startsWith("LIMITED_APPLY_") ? message : null;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return applyNotApprovedResponse();
    }

    const formData = await request.formData();
    const dryRun = getBoolean(formData, "dryRun");
    const approvalStage = getString(formData, "approvalStage");
    const limitedApplyStage = isLimitedApplyStage(approvalStage) ? approvalStage : null;
    const limitedApplyRequested = !dryRun && Boolean(limitedApplyStage);
    if (!dryRun && !limitedApplyRequested) {
      return applyNotApprovedResponse();
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return safeError(400, "UPLOAD_FILE_REQUIRED", "Upload file is required for confirm dry-run.", { applyReady: false });
    }

    if (!isSupportedUploadFile(file.name)) {
      return safeError(415, "INVALID_UPLOAD_FILE", invalidUploadMessage, { applyReady: false });
    }

    const selectedPartCode = normalizePartCode(getString(formData, "selectedPart") || getString(formData, "partCode"));
    if (!selectedPartCode) {
      return safeError(400, "PART_REQUIRED", "Selected part is required for confirm dry-run.", { applyReady: false });
    }

    const operator = getString(formData, "operator");
    if (!operator) {
      return safeError(400, "OPERATOR_REQUIRED", "Operator is required for confirm dry-run.", { applyReady: false });
    }

    const missing = missingAcknowledgements(formData);
    if (missing.length > 0) {
      return safeError(400, "OPERATOR_CONFIRMATION_REQUIRED", "All operator acknowledgements are required.", {
        applyReady: false,
        missing,
      });
    }

    const expectedSourceFileHash = getString(formData, "sourceFileHash");
    const expectedPreviewChecksum = getString(formData, "previewChecksum");
    if (!expectedSourceFileHash || !expectedPreviewChecksum) {
      return safeError(400, "PREVIEW_CONTRACT_REQUIRED", "Preview hash and checksum are required.", { applyReady: false });
    }

    const { sourceFileHash } = await hashUploadFile(file);
    if (sourceFileHash !== expectedSourceFileHash) {
      return safeError(409, "SOURCE_FILE_HASH_MISMATCH", "Uploaded file does not match the previewed file.", { applyReady: false });
    }

    const filePartCode = extractPartCodeFromText(file.name);
    if (filePartCode && filePartCode !== selectedPartCode) {
      return safeError(409, "PART_FILE_MISMATCH", "Selected part does not match the file name part.", {
        applyReady: false,
        selectedPartCode,
        filePartCode,
      });
    }

    const { status, service } = await createPreviewOnlyImportService();
    const preview = await service.preview({
      file,
      partCode: selectedPartCode,
      periodStart: getString(formData, "periodStart") || "2026-06-01",
      periodEnd: getString(formData, "periodEnd") || "2026-06-30",
    });
    const operationalSummary = toOperationalPreviewSummary(preview, status.blockedReasons);
    const previewChecksum = createPreviewChecksum({ sourceFileHash, preview, operationalSummary });

    if (previewChecksum !== expectedPreviewChecksum) {
      return safeError(409, "PREVIEW_CHECKSUM_MISMATCH", "Server re-parse summary does not match the preview checksum.", {
        applyReady: false,
      });
    }

    if (operationalSummary.partMismatch) {
      return safeError(409, "PART_FILE_MISMATCH", "Selected part does not match the file name part.", {
        applyReady: false,
        selectedPartCode: operationalSummary.selectedPartCode,
        filePartCode: operationalSummary.filePartCode,
      });
    }

    const dataBlockedReasons = preview.blockedReasons.filter((reason) => reason !== "PREVIEW_ONLY");
    const hasErrorRows = preview.summary.errorRows > 0;
    const hasWarningRows = preview.summary.warningRows > 0;
    const dryRunReady = !hasErrorRows && !hasWarningRows && dataBlockedReasons.length === 0;
    const applyBlockedReason = hasErrorRows
      ? "HAS_ERROR_ROWS"
      : hasWarningRows
        ? "HAS_WARNING_ROWS"
        : dataBlockedReasons[0] ?? (dryRunReady ? null : "PREVIEW_NOT_COMMITTABLE");
    const statusLabel = dryRunReady ? "DRY_RUN_READY" : "DRY_RUN_BLOCKED";
    const committableRows = preview.rows.filter(isCommittablePreviewRow);
    const syncScope = deriveLedgerSyncScope({
      partCode: selectedPartCode,
      dates: committableRows.map((row) => row.ledgerDate),
      fallbackDateFrom: getString(formData, "periodStart") || "2026-06-01",
      fallbackDateTo: getString(formData, "periodEnd") || "2026-06-30",
    });
    const existingRead = await readExistingLedgerRowsForSync(syncScope);
    const incomingSyncRows = createLedgerSyncRows(committableRows);
    const legacyIncomingSyncRows = createLedgerIdentitySyncRows(committableRows);
    const syncDiff = planLedgerSyncDiff({
      scope: syncScope,
      incomingRows: incomingSyncRows,
      existingRows: existingRead.rows,
      incomingSummary: {
        normalRows: operationalSummary.normalRows,
        excludedRows: preview.summary.excludedRows,
        warningRows: preview.summary.warningRows,
        errorRows: preview.summary.errorRows,
      },
      readOnlyEvidence: {
        readExecuted: existingRead.readExecuted,
        readBlockedReason: existingRead.readBlockedReason,
      },
    });
    const legacySchemaIdentityDiagnostics = summarizeDuplicateSyncKeys(legacyIncomingSyncRows);

    if (dryRun) {
      return NextResponse.json({
      ok: true,
      dryRun: true,
      dryRunReady,
      applyReady: dryRunReady,
      applyBlockedReason,
      actualApplyReady: false,
      actualApplyBlockedReason: "APPLY_NOT_APPROVED",
      report: {
        import_batch_id: `dryrun_${previewChecksum.replace(/^sha256:/, "").slice(0, 16)}`,
        operator,
        selected_part: selectedPartCode,
        source_file_hash: sourceFileHash,
        preview_checksum: previewChecksum,
        total_rows: operationalSummary.totalRows,
        normal_rows: operationalSummary.normalRows,
        excluded_rows: preview.summary.excludedRows,
        warning_rows: preview.summary.warningRows,
        error_rows: preview.summary.errorRows,
        excluded_or_error_rows: operationalSummary.excludedOrErrorRows,
        excluded_by_reason: preview.summary.excludedByReason,
        warning_by_reason: preview.summary.warningByReason,
        error_by_reason: preview.summary.errorByReason,
        amount_total: operationalSummary.amountTotal,
        account_count: operationalSummary.customerCount,
        item_count: operationalSummary.productCount,
        expected_affected_rows: dryRunReady ? preview.summary.insertRows + preview.summary.updateRows : 0,
        created_at: new Date().toISOString(),
        status: hasErrorRows ? "DRY_RUN_BLOCKED_HAS_ERRORS" : hasWarningRows ? "DRY_RUN_BLOCKED_HAS_WARNINGS" : statusLabel,
      },
      side_effects: {
        dbWrite: false,
        storageWrite: false,
        normalizedTableWrite: false,
        actualApply: false,
      },
      syncKeyPolicy: {
        version: "natural_occurrence_v2",
        naturalKeyFields: ["partCode", "ledgerDate", "customerStableKey", "productStableKey", "documentNoOrBlank", "rowType"],
        occurrenceIndexWithinNaturalKey: true,
        amountInIdentityKey: false,
        contentHashIncludesAmounts: true,
        existingRowsUseStoredSchemaIdentity: true,
      },
      legacySchemaIdentityDiagnostics,
      syncDiff,
      });
    }

    const approvalValidation = await loadLimitedApplyApproval(limitedApplyStage ?? "G-6B");
    if (!approvalValidation.ok || !approvalValidation.approval) {
      return safeError(403, "LIMITED_APPLY_APPROVAL_BLOCKED", "Limited apply approval file is missing or invalid.", {
        dryRun: false,
        blocked_reasons: approvalValidation.blockedReasons,
        actualApplyReady: false,
        actualApplyBlockedReason: "LIMITED_APPLY_APPROVAL_BLOCKED",
      });
    }

    const requestedMaxRows = getNumber(formData, "maxRows");
    if (requestedMaxRows !== approvalValidation.approval.max_rows) {
      return safeError(409, "LIMITED_APPLY_MAX_ROWS_MISMATCH", "Requested limited apply row cap does not match approval.", {
        dryRun: false,
        actualApplyReady: false,
        actualApplyBlockedReason: "LIMITED_APPLY_MAX_ROWS_MISMATCH",
      });
    }

    const preconditions = validateLimitedApplyPreconditions({
      approval: approvalValidation.approval,
      sourceFileHash,
      selectedPartCode,
      syncDiff,
    });
    if (!preconditions.ok) {
      return safeError(409, "LIMITED_APPLY_PRECHECK_BLOCKED", "Limited apply precheck failed.", {
        dryRun: false,
        blocked_reasons: preconditions.blockedReasons,
        actualApplyReady: false,
        actualApplyBlockedReason: "LIMITED_APPLY_PRECHECK_BLOCKED",
        syncDiff,
      });
    }

    const selectedRows = selectLimitedApplyRows({
      rows: committableRows,
      syncRows: incomingSyncRows,
      existingRows: existingRead.rows,
      maxRows: approvalValidation.approval.max_rows,
    });
    if (selectedRows.length !== approvalValidation.approval.max_rows) {
      return safeError(409, "LIMITED_APPLY_ROW_SELECTION_MISMATCH", "Limited apply row selection did not match approval.", {
        dryRun: false,
        actualApplyReady: false,
        actualApplyBlockedReason: "LIMITED_APPLY_ROW_SELECTION_MISMATCH",
      });
    }

    const writeService = await createImportService();
    if (!writeService.status.canWrite || !(writeService.repository instanceof SupabaseImportRepository)) {
      return safeError(403, "LIMITED_APPLY_WRITE_CLIENT_BLOCKED", "Supabase write client is not configured for limited apply.", {
        dryRun: false,
        actualApplyReady: false,
        actualApplyBlockedReason: "LIMITED_APPLY_WRITE_CLIENT_BLOCKED",
      });
    }

    const result = await writeService.repository.limitedInsertLedgerRows({
      fileName: file.name,
      partCode: selectedPartCode,
      periodStart: syncScope.dateFrom,
      periodEnd: syncScope.dateTo,
      sourceFileHash,
      previewChecksum,
      operator,
      selectedRows,
      summary: {
        stage: approvalValidation.approval.stage,
        totalRows: operationalSummary.totalRows,
        normalRows: operationalSummary.normalRows,
        excludedRows: preview.summary.excludedRows,
        warningRows: preview.summary.warningRows,
        errorRows: preview.summary.errorRows,
        requestedRows: approvalValidation.approval.max_rows,
        maxRows: approvalValidation.approval.max_rows,
      },
    });

    const expectedIdentityHashes = new Set(selectedRows.map((row) => row.identityHash));
    const readBackIdentityHashes = new Set(result.readBackRows.map((row) => row.identity_hash));
    const readBackMatches =
      result.insertedRows === approvalValidation.approval.max_rows &&
      [...expectedIdentityHashes].every((hash) => readBackIdentityHashes.has(hash));

    return NextResponse.json({
      ok: true,
      dryRun: false,
      applyMode: "limited-apply",
      stage: approvalValidation.approval.stage,
      actualApplyExecuted: true,
      actualApplyReady: false,
      importBatchId: result.importBatchId,
      operator,
      requestedRows: approvalValidation.approval.max_rows,
      insertedRows: result.insertedRows,
      updatedRows: result.updatedRows,
      deletedRows: result.deletedRows,
      normalizedTableWrite: result.normalizedTableWrite,
      readBack: {
        rowCount: result.readBackRows.length,
        matchesRequestedRows: result.readBackRows.length === approvalValidation.approval.max_rows,
        identityHashMatch: readBackMatches,
        contentHashPresent: result.readBackRows.every((row) => Boolean(row.content_hash)),
        selectedColumnsOnly: true,
        selectStarUsed: false,
      },
      rollbackEvidence: {
        importBatchId: result.importBatchId,
        ledgerRowIds: result.readBackRows.map((row) => row.id),
        identityHashes: result.readBackRows.map((row) => row.identity_hash),
        rollbackExecuted: false,
      },
      report: {
        import_batch_id: result.importBatchId,
        applied_count: result.insertedRows,
        rejected_count: 0,
        operator,
        created_at: result.committedAt,
        status: "LIMITED_APPLY_COMMITTED",
      },
      side_effects: {
        dbWrite: true,
        storageWrite: false,
        normalizedTableWrite: false,
        actualApply: true,
        productionPost: false,
        migrationApply: false,
        seedApply: false,
      },
    });
  } catch (error) {
    const limitedApplySafeCode = getLimitedApplySafeCode(error);
    if (limitedApplySafeCode) {
      return safeError(500, limitedApplySafeCode, "Limited apply failed safely.", { applyReady: false });
    }

    return safeError(500, "CONFIRM_DRY_RUN_FAILED", "Confirm dry-run failed safely.", { applyReady: false });
  }
}
