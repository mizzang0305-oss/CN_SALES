import { describe, expect, it, vi } from "vitest";
import { POST as dryRunPost } from "@/app/api/sales-import/dry-run/route";
import { POST as previewPost } from "@/app/api/sales-import/preview/route";
import { createSalesImportDryRunResponse } from "@/lib/web-import/sales-dry-run";
import { validateSalesImportPreviewAccess } from "@/lib/web-import/sales-preview";
import type { OperationalPreviewSummary } from "@/lib/import/preview-checksum";
import type { LedgerSyncDiffPlan } from "@/lib/import/sync-diff";

vi.mock("server-only", () => ({}));

describe("sales import dry-run API", () => {
  it("returns aggregate-only dry-run results without DB writes", async () => {
    const preview = await createPreviewContract({ part: "1", role: "SALES_REP_PART_1" });
    const response = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", {
      method: "POST",
      body: createDryRunFormData({ file: makeFile("1"), preview, role: "SALES_REP_PART_1" }),
    }));
    const text = await response.text();
    const body = JSON.parse(text) as {
      ok: boolean;
      primaryScopeRows: number;
      existingScopedRows: number;
      insertCandidates: number;
      updateCandidates: number;
      removedFromCurrentCandidates: number;
      noChangeRows: number;
      amountBefore: number;
      amountAfter: number;
      amountDelta: number;
      blockedRows: number;
      planReady: boolean;
      rawRowsReturned: false;
      sideEffects: { dbWrite: boolean; storageWrite: boolean; sync: boolean; apply: boolean; physicalDelete: boolean };
      blockedReasons: string[];
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      primaryScopeRows: 2,
      existingScopedRows: 0,
      insertCandidates: 2,
      updateCandidates: 0,
      removedFromCurrentCandidates: 0,
      noChangeRows: 0,
      amountBefore: 0,
      amountAfter: 20000,
      amountDelta: 20000,
      blockedRows: 0,
      planReady: false,
      rawRowsReturned: false,
      sideEffects: { dbWrite: false, storageWrite: false, sync: false, apply: false, physicalDelete: false },
    });
    expect(body.blockedReasons).toContain("SYNC_DIFF_DB_READ_DISABLED_IN_TEST");
    expect(text).not.toContain("\"rows\"");
    expect(text).not.toContain("Synthetic Customer");
    expect(text).not.toContain("Synthetic Product");
  });

  it("enforces part permissions for sales reps, part leads, and admins", async () => {
    const partOnePreview = await createPreviewContract({ part: "1", role: "SALES_REP_PART_1" });
    const allowedRep = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", {
      method: "POST",
      body: createDryRunFormData({ file: makeFile("1"), preview: partOnePreview, role: "SALES_REP_PART_1" }),
    }));
    expect(allowedRep.status).toBe(200);

    const partFourPreview = await createPreviewContract({ part: "4", role: "ADMIN" });
    const blockedRep = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", {
      method: "POST",
      body: createDryRunFormData({ file: makeFile("4"), preview: partFourPreview, role: "SALES_REP_PART_1" }),
    }));
    expect(blockedRep.status).toBe(403);
    expect(await blockedRep.text()).toContain("PART_SCOPE_FORBIDDEN");

    const allowedAdmin = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", {
      method: "POST",
      body: createDryRunFormData({ file: makeFile("4"), preview: partFourPreview, role: "ADMIN" }),
    }));
    expect(allowedAdmin.status).toBe(200);

    const leadAllowed = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", {
      method: "POST",
      body: createDryRunFormData({ file: makeFile("4"), preview: partFourPreview, role: "PART_LEAD", managedParts: "1,4" }),
    }));
    expect(leadAllowed.status).toBe(200);

    const leadBlocked = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", {
      method: "POST",
      body: createDryRunFormData({ file: makeFile("4"), preview: partFourPreview, role: "PART_LEAD", managedParts: "1" }),
    }));
    expect(leadBlocked.status).toBe(403);
  });

  it("blocks file hash, period, part, and preview contract mismatches", async () => {
    const preview = await createPreviewContract({ part: "1", role: "ADMIN" });

    const hashMismatch = createDryRunFormData({ file: makeFile("1"), preview, role: "ADMIN" });
    hashMismatch.set("fileHash", "sha256:0000000000000000000000000000000000000000000000000000000000000000");
    const hashResponse = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", { method: "POST", body: hashMismatch }));
    expect(hashResponse.status).toBe(409);
    expect(await hashResponse.text()).toContain("FILE_HASH_MISMATCH");

    const periodMismatch = createDryRunFormData({ file: makeFile("1"), preview, role: "ADMIN" });
    periodMismatch.set("periodStart", "2026-06-07");
    periodMismatch.set("periodEnd", "2026-06-12");
    const periodResponse = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", { method: "POST", body: periodMismatch }));
    expect(periodResponse.status).toBe(409);
    expect(await periodResponse.text()).toContain("PERIOD_MISMATCH");

    const partMismatch = createDryRunFormData({ file: makeFile("4"), preview, role: "ADMIN" });
    const partResponse = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", { method: "POST", body: partMismatch }));
    expect(partResponse.status).toBe(409);
    expect(await partResponse.text()).toContain("PART_MISMATCH");

    const invalidContract = createDryRunFormData({ file: makeFile("1"), preview, role: "ADMIN" });
    invalidContract.set("normalRows", "999");
    const invalidResponse = await dryRunPost(new Request("http://localhost/api/sales-import/dry-run", { method: "POST", body: invalidContract }));
    expect(invalidResponse.status).toBe(409);
    expect(await invalidResponse.text()).toContain("NORMAL_ROWS_MISMATCH");
  });
});

describe("sales import dry-run response mapping", () => {
  it("maps update, removed, no-change, amount, and readiness aggregates", () => {
    const access = validateSalesImportPreviewAccess({ role: "ADMIN", partCode: "4" });
    const response = createSalesImportDryRunResponse({
      fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      part: "4",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-06",
      operationalSummary: fakeOperationalSummary(),
      syncDiff: fakeSyncDiff(),
      amountBefore: 12000,
      access,
    });

    expect(response).toMatchObject({
      primaryScopeRows: 10,
      existingScopedRows: 8,
      insertCandidates: 2,
      updateCandidates: 1,
      removedFromCurrentCandidates: 3,
      noChangeRows: 4,
      amountBefore: 12000,
      amountAfter: 20000,
      amountDelta: 8000,
      blockedRows: 0,
      planReady: true,
      rawRowsReturned: false,
      sideEffects: { dbWrite: false, storageWrite: false, sync: false, apply: false, physicalDelete: false },
    });
  });
});

async function createPreviewContract(input: { part: string; role: string }) {
  const response = await previewPost(new Request("http://localhost/api/sales-import/preview", {
    method: "POST",
    body: createPreviewFormData({ file: makeFile(input.part), role: input.role }),
  }));
  expect(response.status).toBe(200);
  return await response.json() as {
    fileHash: string;
    part: string;
    periodStart: string;
    periodEnd: string;
    normalRows: number;
    excludedRows: number;
    amountTotal: number;
    warningRows: number;
    errorRows: number;
  };
}

function createPreviewFormData(input: { file: File; role: string }) {
  const formData = new FormData();
  formData.set("file", input.file);
  formData.set("role", input.role);
  formData.set("periodMonth", "2026-06");
  return formData;
}

function createDryRunFormData(input: { file: File; preview: Awaited<ReturnType<typeof createPreviewContract>>; role: string; managedParts?: string }) {
  const formData = new FormData();
  formData.set("file", input.file);
  formData.set("role", input.role);
  formData.set("managedParts", input.managedParts ?? "");
  formData.set("part", input.preview.part);
  formData.set("periodStart", input.preview.periodStart);
  formData.set("periodEnd", input.preview.periodEnd);
  formData.set("fileHash", input.preview.fileHash);
  formData.set("normalRows", String(input.preview.normalRows));
  formData.set("excludedRows", String(input.preview.excludedRows));
  formData.set("amountTotal", String(input.preview.amountTotal));
  formData.set("warningRows", String(input.preview.warningRows));
  formData.set("errorRows", String(input.preview.errorRows));
  return formData;
}

function makeFile(part: string) {
  return new File([JSON.stringify(jsonRows(part))], `part-${part} 1-6\uC77C sales.json`, { type: "application/json" });
}

function jsonRows(part: string) {
  return [
    {
      date: "2026-06-05",
      row_type: "customer_total",
      part,
      customer_name: "Synthetic Customer A",
      sales_amount: 20000,
      ar_balance: 30000,
    },
    {
      date: "2026-06-05",
      row_type: "item_detail",
      part,
      customer_name: "Synthetic Customer A",
      product_name: "Synthetic Product A",
      quantity: 2,
      unit_price: 10000,
      sales_amount: 20000,
    },
  ];
}

function fakeOperationalSummary(): OperationalPreviewSummary {
  return {
    totalRows: 10,
    normalRows: 10,
    excludedRows: 0,
    warningRows: 0,
    errorRows: 0,
    excludedOrErrorRows: 0,
    excludedByReason: {},
    warningByReason: {},
    errorByReason: {},
    partMismatch: false,
    selectedPartCode: "4",
    filePartCode: "4",
    amountTotal: 20000,
    salesTotal: 20000,
    receiptTotal: 0,
    customerCount: 1,
    productCount: 1,
    warnings: [],
  };
}

function fakeSyncDiff(): LedgerSyncDiffPlan {
  return {
    scope: { partCode: "4", dateFrom: "2026-06-01", dateTo: "2026-06-06", scopeSource: "explicit-request" },
    planReady: true,
    blockedReasons: [],
    incoming: { normalRows: 10, excludedRows: 0, warningRows: 0, errorRows: 0 },
    existing: { scopedRows: 8 },
    diff: {
      insertCandidates: 2,
      updateCandidates: 1,
      deleteCandidates: 3,
      noChangeRows: 4,
      duplicateIncomingKeys: 0,
      duplicateExistingKeys: 0,
      duplicateIncomingIdentityHashes: 0,
      duplicateExistingIdentityHashes: 0,
    },
    diagnostics: {
      incomingIdentity: emptyDuplicateSummary(),
      existingIdentity: emptyDuplicateSummary(),
      incomingNaturalKey: emptyDuplicateSummary(),
    },
    safety: { dbWriteExecuted: false, deleteExecuted: false, productionPostExecuted: false },
    readOnlyEvidence: {
      readExecuted: true,
      readBlockedReason: null,
      selectedColumnsOnly: true,
      selectStarUsed: false,
      reader: null,
    },
  };
}

function emptyDuplicateSummary() {
  return {
    duplicateKeyCount: 0,
    duplicateRowCount: 0,
    maxDuplicateGroupSize: 0,
    groupsWithSameContentHash: 0,
    groupsWithMixedContentHash: 0,
  };
}
