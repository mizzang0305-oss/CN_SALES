import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractPartCodeFromText, getSelectedFilePartMismatch } from "@/lib/import/master-data";

const uploadCenterSource = readFileSync(join(process.cwd(), "src", "components", "uploads", "upload-center.tsx"), "utf8");
const previewRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "uploads", "preview", "route.ts"), "utf8");
const serviceFactorySource = readFileSync(join(process.cwd(), "src", "lib", "import", "service-factory.ts"), "utf8");
const supabaseRepositorySource = readFileSync(join(process.cwd(), "src", "lib", "import", "supabase-repository.ts"), "utf8");

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
    expect(uploadCenterSource).toContain("!file && <pre");
    expect(uploadCenterSource).toContain("confirmDisabled");
  });

  it("marks the preview route as node runtime and logs only high-level preview side effects", () => {
    expect(previewRouteSource).toContain('export const runtime = "nodejs"');
    expect(previewRouteSource).toContain("parserCalled: true");
    expect(previewRouteSource).toContain("previewRecordCreated");
    expect(previewRouteSource).toContain("normalizedTableWrite: false");
    expect(previewRouteSource).not.toMatch(/rawRowJson|raw_row_json/);
  });

  it("does not write normalized ledger tables during Supabase preview creation", () => {
    const createPreviewSource = sliceMethod(supabaseRepositorySource, "createPreview", "getExistingContentHashes");

    expect(createPreviewSource).toContain('.from("ledger_uploads")');
    expect(createPreviewSource).toContain('.from("upload_preview_results")');
    for (const tableName of ["ledger_rows", "sales_transactions", "receipt_transactions", "ar_snapshots"]) {
      expect(createPreviewSource).not.toContain(`.from("${tableName}")`);
    }
  });

  it("uses a local admin profile fallback only outside production when no browser session exists", () => {
    expect(serviceFactorySource).toContain("CN_SALES_ADMIN_AUTH_USER_ID");
    expect(serviceFactorySource).toContain('process.env.NODE_ENV !== "production"');
    expect(serviceFactorySource).toContain('error.message === "Supabase session is missing."');
    expect(serviceFactorySource).toContain("loadContextForProfile(serviceRoleClient");
  });
});

function sliceMethod(source: string, methodName: string, nextMethodName: string) {
  const start = source.indexOf(`async ${methodName}`);
  const end = source.indexOf(`\n  async ${nextMethodName}`, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
