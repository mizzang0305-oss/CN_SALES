import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractPartCodeFromText, getSelectedFilePartMismatch } from "@/lib/import/master-data";

const uploadCenterSource = readFileSync(join(process.cwd(), "src", "components", "uploads", "upload-center.tsx"), "utf8");
const previewRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "uploads", "preview", "route.ts"), "utf8");
const confirmRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "uploads", "confirm", "route.ts"), "utf8");
const serviceFactorySource = readFileSync(join(process.cwd(), "src", "lib", "import", "service-factory.ts"), "utf8");
const pythonParserSource = readFileSync(join(process.cwd(), "src", "lib", "import", "python-parser.ts"), "utf8");

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
    expect(confirmRouteSource).toContain("createPreviewOnlyImportService");
    expect(confirmRouteSource).toContain("createPreviewChecksum");
    expect(confirmRouteSource).not.toContain("createImportService");
    expect(confirmRouteSource).not.toContain("confirmPreview");
    expect(confirmRouteSource).not.toContain("error.message");
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
