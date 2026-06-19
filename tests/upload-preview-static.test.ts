import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractPartCodeFromText, getSelectedFilePartMismatch } from "@/lib/import/master-data";

const uploadCenterSource = readFileSync(join(process.cwd(), "src", "components", "uploads", "upload-center.tsx"), "utf8");
const previewRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "uploads", "preview", "route.ts"), "utf8");
const confirmRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "uploads", "confirm", "route.ts"), "utf8");
const serviceFactorySource = readFileSync(join(process.cwd(), "src", "lib", "import", "service-factory.ts"), "utf8");
const supabaseRepositorySource = readFileSync(join(process.cwd(), "src", "lib", "import", "supabase-repository.ts"), "utf8");
const limitedApplySource = readFileSync(join(process.cwd(), "src", "lib", "import", "limited-apply.ts"), "utf8");
const finalSyncVerificationSource = readFileSync(join(process.cwd(), "src", "lib", "import", "final-sync-verification.ts"), "utf8");
const pythonParserSource = readFileSync(join(process.cwd(), "src", "lib", "import", "python-parser.ts"), "utf8");
const envSource = readFileSync(join(process.cwd(), "src", "lib", "env.ts"), "utf8");

describe("upload preview safety and part mismatch guards", () => {
  it("detects the part code from Korean XLS file names and warns on selected part mismatch", () => {
    const fileName = "11\uD30C\uD2B8 1~6\uC77C \uB9E4\uCD9C\uD604\uD669.XLS";

    expect(extractPartCodeFromText(fileName)).toBe("11");
    expect(getSelectedFilePartMismatch({ selectedPartCode: "1", fileName })).toMatchObject({
      code: "PART_FILE_MISMATCH",
      selectedPartCode: "1",
      filePartCode: "11",
    });
    expect(getSelectedFilePartMismatch({ selectedPartCode: "11", fileName })).toBeNull();
  });

  it("keeps the upload screen from treating fixture rows like a selected real file", () => {
    expect(uploadCenterSource).toContain("extractPartCodeFromText");
    expect(uploadCenterSource).toContain("getSelectedFilePartMismatch");
    expect(uploadCenterSource).toContain("partOptions");
    expect(uploadCenterSource).toContain('setPartCode(event.target.value)');
    expect(uploadCenterSource).toContain("confirmationLabels");
    expect(uploadCenterSource).toContain("previewChecked");
    expect(uploadCenterSource).toContain("partMatchChecked");
    expect(uploadCenterSource).toContain("rollbackAcknowledged");
    expect(uploadCenterSource).toContain("dryRunDisabled");
    expect(uploadCenterSource).toContain("runDryRunConfirm");
    expect(uploadCenterSource).toContain("syncDiff");
    expect(uploadCenterSource).toContain("scope_source");
    expect(uploadCenterSource).toContain("insertCandidates");
    expect(uploadCenterSource).toContain("deleteCandidates");
    expect(uploadCenterSource).toContain("incomingIdentityDuplicates");
    expect(uploadCenterSource).toContain("incomingNaturalKeyGroups");
    expect(uploadCenterSource).toContain("legacySchemaDuplicates");
    expect(uploadCenterSource).toContain("실제 DB 반영 준비중");
  });

  it("marks the preview route as node runtime and logs only high-level preview side effects", () => {
    expect(previewRouteSource).toContain('export const runtime = "nodejs"');
    expect(previewRouteSource).toContain("parserCalled: true");
    expect(previewRouteSource).toContain("storageSaved: false");
    expect(previewRouteSource).toContain("previewRecordCreated");
    expect(previewRouteSource).toContain("previewOnly: true");
    expect(previewRouteSource).toContain("normalizedTableWrite: false");
    expect(previewRouteSource).toContain("operationalSummary");
    expect(previewRouteSource).toContain("excludedRows");
    expect(previewRouteSource).toContain("warningRows");
    expect(previewRouteSource).toContain("createPreviewOnlyImportService");
    expect(previewRouteSource).not.toMatch(new RegExp(`raw${"Row"}Json|raw${"_row"}${"_json"}`));
  });

  it("keeps the preview route out of write-enabled import and storage paths", () => {
    expect(previewRouteSource).not.toContain("createOperatorPreviewImportService");
    expect(previewRouteSource).not.toContain("createImportService");
    expect(previewRouteSource).not.toContain("SupabaseUploadStorageAdapter");
    expect(previewRouteSource).not.toContain("ledger_uploads");
    expect(previewRouteSource).not.toContain("upload_preview_results");
    expect(previewRouteSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });

  it("keeps the confirm route limited to manual dry-run re-parse", () => {
    expect(confirmRouteSource).toContain("operator");
    expect(confirmRouteSource).toContain("ackPreviewReviewed");
    expect(confirmRouteSource).toContain("ackPartMatched");
    expect(confirmRouteSource).toContain("ackApplyRisk");
    expect(confirmRouteSource).toContain("import_batch_id");
    expect(confirmRouteSource).toContain("APPLY_NOT_APPROVED");
    expect(confirmRouteSource).toContain("dryRunReady");
    expect(confirmRouteSource).toContain("actualApplyReady");
    expect(confirmRouteSource).toContain("actualApplyBlockedReason");
    expect(confirmRouteSource).toContain("excluded_by_reason");
    expect(confirmRouteSource).toContain("warning_by_reason");
    expect(confirmRouteSource).toContain("error_by_reason");
    expect(confirmRouteSource).toContain("createPreviewOnlyImportService");
    expect(confirmRouteSource).toContain("approvalStage");
    expect(confirmRouteSource).toContain("isLimitedApplyStage");
    expect(confirmRouteSource).toContain("loadLimitedApplyApproval");
    expect(confirmRouteSource).toContain("validateLimitedApplyPreconditions");
    expect(confirmRouteSource).toContain("requestPeriodStart");
    expect(confirmRouteSource).toContain("requestPeriodEnd");
    expect(confirmRouteSource).toContain("explicitDateFrom");
    expect(confirmRouteSource).toContain("explicitDateTo");
    expect(confirmRouteSource).toContain("scopeSource");
    expect(confirmRouteSource).toContain("LIMITED_APPLY_PERIOD_SCOPE_REQUIRED");
    expect(confirmRouteSource).toContain("selectLimitedApplyRows");
    expect(confirmRouteSource).toContain("summarizeLimitedApplyDateGuard");
    expect(confirmRouteSource).toContain("limitedApplyDateGuard");
    expect(confirmRouteSource).toContain("LIMITED_APPLY_LEDGER_DATE_BLOCKED");
    expect(confirmRouteSource).toContain("limitedInsertLedgerRows");
    expect(confirmRouteSource).toContain("LIMITED_APPLY_PRECHECK_BLOCKED");
    expect(confirmRouteSource).toContain("LIMITED_APPLY_WRITE_CLIENT_BLOCKED");
    expect(confirmRouteSource).toContain("createPreviewChecksum");
    expect(confirmRouteSource).toContain("createLedgerSyncRows");
    expect(confirmRouteSource).toContain("legacySchemaIdentityDiagnostics");
    expect(confirmRouteSource).toContain("selectionDiagnostics");
    expect(confirmRouteSource).toContain("createLimitedApplySelectionDiagnostics");
    expect(confirmRouteSource).toContain("natural_occurrence_v2");
    expect(confirmRouteSource).not.toContain("confirmPreview");
    expect(confirmRouteSource).not.toContain("error.message");
  });

  it("keeps G-6B/G-6D/G-6E/G-6F/G-6G/G-6H/G-6I/H-2/I-series limited apply on insert-only ledger row persistence", () => {
    const methodStart = supabaseRepositorySource.indexOf("async limitedInsertLedgerRows");
    const methodEnd = supabaseRepositorySource.indexOf("async getDashboardTotals", methodStart);
    const methodSource = supabaseRepositorySource.slice(methodStart, methodEnd);

    expect(methodStart).toBeGreaterThanOrEqual(0);
    expect(methodEnd).toBeGreaterThan(methodStart);
    expect(methodSource).toContain('.from("ledger_uploads")');
    expect(methodSource).toContain('.from("ledger_rows")');
    expect(methodSource).toContain(".insert(");
    expect(methodSource).toContain("ledgerDate: selection.syncRow.ledgerDate");
    expect(methodSource).toContain('.eq("upload_id", upload.id)');
    expect(methodSource).toContain(".range(0, readBackRangeEnd)");
    expect(methodSource).toContain("normalizedTableWrite: false");
    expect(methodSource).not.toContain('.in("id", insertedIds)');
    expect(methodSource).not.toContain(".update(");
    expect(methodSource).not.toContain(".delete(");
    expect(methodSource).not.toContain(".upsert(");
    expect(methodSource).not.toContain("insertNormalized");
    expect(methodSource).not.toContain("upsertCustomer");
    expect(methodSource).not.toContain("upsertProduct");
  });

  it("keeps G-6F configured as a max-500 explicit limited apply stage", () => {
    expect(limitedApplySource).toContain('"G-6F"');
    expect(limitedApplySource).toContain("g6f_limited_apply_approval.json");
    expect(limitedApplySource).toContain("expectedMaxRows: 500");
    expect(limitedApplySource).toContain("expectedExistingScopedRows: 133");
    expect(limitedApplySource).toContain("expectedInsertCandidates: 1986");
    expect(limitedApplySource).toContain("expectedNoChangeRows: 133");
    expect(limitedApplySource).toContain("requireExplicitRequestScope");
    expect(limitedApplySource).toContain("REQUEST_PERIOD_SCOPE_REQUIRED");
    expect(limitedApplySource).toContain("REQUEST_SCOPE_DATE_MISMATCH");
  });

  it("keeps G-6G configured as a max-500 explicit limited apply stage", () => {
    expect(limitedApplySource).toContain('"G-6G"');
    expect(limitedApplySource).toContain("g6g_limited_apply_approval.json");
    expect(limitedApplySource).toContain("expectedMaxRows: 500");
    expect(limitedApplySource).toContain("expectedExistingScopedRows: 633");
    expect(limitedApplySource).toContain("expectedInsertCandidates: 1486");
    expect(limitedApplySource).toContain("expectedNoChangeRows: 633");
    expect(limitedApplySource).toContain("requireExplicitRequestScope");
    expect(limitedApplySource).toContain("REQUEST_PERIOD_SCOPE_REQUIRED");
    expect(limitedApplySource).toContain("REQUEST_SCOPE_DATE_MISMATCH");
  });

  it("keeps G-6H configured as a max-500 explicit limited apply stage", () => {
    expect(limitedApplySource).toContain('"G-6H"');
    expect(limitedApplySource).toContain("g6h_limited_apply_approval.json");
    expect(limitedApplySource).toContain("expectedMaxRows: 500");
    expect(limitedApplySource).toContain("expectedExistingScopedRows: 1133");
    expect(limitedApplySource).toContain("expectedInsertCandidates: 986");
    expect(limitedApplySource).toContain("expectedNoChangeRows: 1133");
    expect(limitedApplySource).toContain("requiresExplicitPeriod: true");
  });

  it("keeps G-6I configured as a final max-486 explicit limited apply stage", () => {
    expect(limitedApplySource).toContain('"G-6I"');
    expect(limitedApplySource).toContain("g6i_limited_apply_approval.json");
    expect(limitedApplySource).toContain("expectedMaxRows: 486");
    expect(limitedApplySource).toContain("expectedExistingScopedRows: 1633");
    expect(limitedApplySource).toContain("expectedInsertCandidates: 486");
    expect(limitedApplySource).toContain("expectedNoChangeRows: 1633");
    expect(limitedApplySource).toContain("requiresExplicitPeriod: true");
  });

  it("keeps H-2 configured as an explicit max-500 next XLS limited apply stage", () => {
    expect(limitedApplySource).toContain('"H-2"');
    expect(limitedApplySource).toContain("H2_EXPECTED_SOURCE_FILE_HASH");
    expect(limitedApplySource).toContain("h2_limited_apply_approval.json");
    expect(limitedApplySource).toContain("expectedMaxRows: 500");
    expect(limitedApplySource).toContain("expectedExistingScopedRows: 0");
    expect(limitedApplySource).toContain("expectedInsertCandidates: 2473");
    expect(limitedApplySource).toContain("expectedNoChangeRows: 0");
    expect(limitedApplySource).toContain('expectedDateFrom: "2026-06-07"');
    expect(limitedApplySource).toContain('expectedDateTo: "2026-06-12"');
    expect(limitedApplySource).toContain("requiresExplicitPeriod: true");
  });

  it("keeps H-2F final remainder support exact and workflow-gated", () => {
    expect(limitedApplySource).toContain('const H2_FINAL_REMAINDER_WORKFLOW_GATE = "H-2F"');
    expect(limitedApplySource).toContain("H2_FINAL_REMAINDER_EXPECTED");
    expect(limitedApplySource).toContain("maxRows: 473");
    expect(limitedApplySource).toContain("expectedInsertedRows: 473");
    expect(limitedApplySource).toContain("primaryScopeRows: 2473");
    expect(limitedApplySource).toContain("existingScopedRows: 2000");
    expect(limitedApplySource).toContain("insertCandidates: 473");
    expect(limitedApplySource).toContain("updateCandidates: 0");
    expect(limitedApplySource).toContain("deleteCandidates: 0");
    expect(limitedApplySource).toContain("noChangeRows: 2000");
    expect(limitedApplySource).toContain("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
    expect(limitedApplySource).toContain("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_DELETE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).not.toContain("startsWith(\"H-\")");
    expect(limitedApplySource).not.toContain("max_rows <= 500");
  });

  it("keeps I-series configured as exact part-1 limited apply stages", () => {
    expect(limitedApplySource).toContain('"I-2"');
    expect(limitedApplySource).toContain('"I-3"');
    expect(limitedApplySource).toContain('"I-4"');
    expect(limitedApplySource).toContain('"I-5"');
    expect(limitedApplySource).toContain("I2_EXPECTED_SOURCE_FILE_HASH");
    expect(limitedApplySource).toContain("I_SERIES_EXPECTED");
    expect(limitedApplySource).toContain("i2_limited_apply_approval.json");
    expect(limitedApplySource).toContain("i3_limited_apply_approval.json");
    expect(limitedApplySource).toContain("i4_limited_apply_approval.json");
    expect(limitedApplySource).toContain("i5_limited_apply_approval.json");
    expect(limitedApplySource).toContain('expectedTargetPartCode: "1"');
    expect(limitedApplySource).toContain('expectedWorkflowGate: I_SERIES_EXPECTED["I-3"].workflowGate');
    expect(limitedApplySource).toContain("expectedMaxRows: 500");
    expect(limitedApplySource).toContain("maxRows: 28");
    expect(limitedApplySource).toContain("expectedInsertedRows: 28");
    expect(limitedApplySource).toContain("existingScopedRows: 500");
    expect(limitedApplySource).toContain("insertCandidates: 1028");
    expect(limitedApplySource).toContain("existingScopedRows: 1000");
    expect(limitedApplySource).toContain("insertCandidates: 528");
    expect(limitedApplySource).toContain("existingScopedRows: 1500");
    expect(limitedApplySource).toContain("insertCandidates: 28");
    expect(limitedApplySource).toContain('expectedDateFrom: "2026-06-01"');
    expect(limitedApplySource).toContain('expectedDateTo: "2026-06-06"');
    expect(limitedApplySource).toContain("validateISeriesApprovalShape");
    expect(limitedApplySource).toContain("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_DELETE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).not.toContain("startsWith(\"I-\")");
    expect(limitedApplySource).not.toContain("max_rows <= 500");
  });

  it("keeps J-series configured as exact part-4 limited apply stages", () => {
    expect(limitedApplySource).toContain('"J-2"');
    expect(limitedApplySource).toContain('"J-3"');
    expect(limitedApplySource).toContain('"J-4"');
    expect(limitedApplySource).toContain("J2_EXPECTED_SOURCE_FILE_HASH");
    expect(limitedApplySource).toContain("J_SERIES_EXPECTED");
    expect(limitedApplySource).toContain("j2_limited_apply_approval.json");
    expect(limitedApplySource).toContain("j3_limited_apply_approval.json");
    expect(limitedApplySource).toContain("j4_limited_apply_approval.json");
    expect(limitedApplySource).toContain('expectedTargetPartCode: "4"');
    expect(limitedApplySource).toContain('expectedWorkflowGate: J_SERIES_EXPECTED["J-3"].workflowGate');
    expect(limitedApplySource).toContain("expectedMaxRows: 500");
    expect(limitedApplySource).toContain("maxRows: 295");
    expect(limitedApplySource).toContain("expectedInsertedRows: 295");
    expect(limitedApplySource).toContain("primaryScopeRows: 1295");
    expect(limitedApplySource).toContain("existingScopedRows: 500");
    expect(limitedApplySource).toContain("insertCandidates: 795");
    expect(limitedApplySource).toContain("existingScopedRows: 1000");
    expect(limitedApplySource).toContain("insertCandidates: 295");
    expect(limitedApplySource).toContain('expectedDateFrom: "2026-06-01"');
    expect(limitedApplySource).toContain('expectedDateTo: "2026-06-06"');
    expect(limitedApplySource).toContain("validateJSeriesApprovalShape");
    expect(limitedApplySource).toContain("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_DELETE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).not.toContain("startsWith(\"J-\")");
    expect(limitedApplySource).not.toContain("max_rows <= 500");
  });

  it("keeps K-series configured as exact part-4 limited apply stages", () => {
    expect(limitedApplySource).toContain('"K-2"');
    expect(limitedApplySource).toContain('"K-3"');
    expect(limitedApplySource).toContain('"K-4"');
    expect(limitedApplySource).toContain("K2_EXPECTED_SOURCE_FILE_HASH");
    expect(limitedApplySource).toContain("K_SERIES_EXPECTED");
    expect(limitedApplySource).toContain("k2_limited_apply_approval.json");
    expect(limitedApplySource).toContain("k3_limited_apply_approval.json");
    expect(limitedApplySource).toContain("k4_limited_apply_approval.json");
    expect(limitedApplySource).toContain('expectedTargetPartCode: "4"');
    expect(limitedApplySource).toContain('expectedWorkflowGate: K_SERIES_EXPECTED["K-3"].workflowGate');
    expect(limitedApplySource).toContain("expectedMaxRows: 500");
    expect(limitedApplySource).toContain("maxRows: 338");
    expect(limitedApplySource).toContain("expectedInsertedRows: 338");
    expect(limitedApplySource).toContain("primaryScopeRows: 1338");
    expect(limitedApplySource).toContain("existingScopedRows: 500");
    expect(limitedApplySource).toContain("insertCandidates: 838");
    expect(limitedApplySource).toContain("existingScopedRows: 1000");
    expect(limitedApplySource).toContain("insertCandidates: 338");
    expect(limitedApplySource).toContain('expectedDateFrom: "2026-06-07"');
    expect(limitedApplySource).toContain('expectedDateTo: "2026-06-12"');
    expect(limitedApplySource).toContain("validateKSeriesApprovalShape");
    expect(limitedApplySource).toContain("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).toContain("APPROVAL_DELETE_CANDIDATES_MISMATCH");
    expect(limitedApplySource).not.toContain("startsWith(\"K-\")");
    expect(limitedApplySource).not.toContain("max_rows <= 500");
  });

  it("keeps production mode from enabling dryRun=false DB writes", () => {
    expect(envSource).toContain('const nodeEnv = process.env.NODE_ENV');
    expect(envSource).toContain('nodeEnv === "production"');
    expect(envSource).toContain("DB writes are disabled in production.");
    expect(envSource).toContain("CN_SALES_ALLOW_DB_WRITES");
    expect(envSource).toContain('nodeEnv !== "production"');
  });

  it("keeps final sync verification aggregate-only and write-free", () => {
    expect(finalSyncVerificationSource).toContain("finalSyncExpectedState");
    expect(finalSyncVerificationSource).toContain("normalRows: 2119");
    expect(finalSyncVerificationSource).toContain("excludedRows: 275");
    expect(finalSyncVerificationSource).toContain("existingScopedRows: 2119");
    expect(finalSyncVerificationSource).toContain("insertCandidates: 0");
    expect(finalSyncVerificationSource).toContain("updateCandidates: 0");
    expect(finalSyncVerificationSource).toContain("deleteCandidates: 0");
    expect(finalSyncVerificationSource).toContain("noChangeRows: 2119");
    expect(finalSyncVerificationSource).toContain("sourceRowsIncluded: false");
    expect(finalSyncVerificationSource).toContain("dbWriteRequired: false");
    expect(finalSyncVerificationSource).not.toMatch(/insert\(|upsert\(|update\(|delete\(|rpc\(/);
  });

  it("keeps preview-only service separate from Supabase preview persistence", () => {
    expect(serviceFactorySource).toContain("createPreviewOnlyImportService");
    expect(serviceFactorySource).toContain("PreviewOnlyStorageAdapter");
    expect(serviceFactorySource).toContain("PreviewOnlyImportRepository");
    expect(serviceFactorySource).toContain("export const createPreviewImportService = createPreviewOnlyImportService");
  });

  it("uses an ASCII temp file name before handing uploaded workbooks to Python", () => {
    expect(pythonParserSource).toContain("getSafeWorkerFileName");
    expect(pythonParserSource).toContain("supportedWorkerExtensions");
    expect(pythonParserSource).toContain("randomUUID");
    expect(pythonParserSource).toContain("workerStdoutMaxBuffer");
    expect(pythonParserSource).toContain("maxBuffer: workerStdoutMaxBuffer");
    expect(pythonParserSource).toContain('".xls"');
    expect(pythonParserSource).toContain('".xlsx"');
    expect(pythonParserSource).not.toContain("input.file.name.replace");
  });

  it("uses a local admin profile fallback only outside production when no browser session exists", () => {
    expect(serviceFactorySource).toContain("CN_SALES_ADMIN_AUTH_USER_ID");
    expect(serviceFactorySource).toContain('process.env.NODE_ENV !== "production"');
    expect(serviceFactorySource).toContain('error.message === "Supabase session is missing."');
    expect(serviceFactorySource).toContain("loadContextForProfile(serviceRoleClient");
  });
});
