import { NextResponse } from "next/server";
import { parseManagedPartCodes } from "@/lib/auth/part-access";
import {
  createDisabledSalesSyncScopeResponse,
  normalizeSyncScopeActorRole,
  type SalesSyncScopeDisabledRequest,
} from "@/lib/web-import/sales-sync-scope-disabled";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await readSyncScopePayload(request);
    const response = createDisabledSalesSyncScopeResponse(payload);

    return NextResponse.json(response, { status: 423 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "approval_required",
        syncEnabled: false,
        message: "Current-view sync requires explicit schema/apply approval.",
        rawRowsReturned: false,
        validation: {
          roleScopeChecked: false,
          roleScopeOk: false,
          approvalContractChecked: false,
          approvalContractOk: false,
          syncPlanChecked: false,
          syncPlanOk: false,
          blockedReasons: ["SYNC_SCOPE_REQUEST_INVALID"],
        },
        sideEffects: {
          dbWrite: false,
          storageWrite: false,
          sync: false,
          apply: false,
          physicalDelete: false,
          migration: false,
          seed: false,
          productionPost: false,
        },
      },
      { status: 400 },
    );
  }
}

async function readSyncScopePayload(request: Request): Promise<SalesSyncScopeDisabledRequest> {
  const contentType = request.headers.get("content-type") ?? "";
  const values = contentType.includes("multipart/form-data")
    ? formDataToRecord(await request.formData())
    : await jsonToRecord(request);
  const actorManagedParts = parseManagedPartCodes(text(values.managedParts) ?? request.headers.get("x-cn-sales-managed-parts"));
  const actorRole = normalizeSyncScopeActorRole(text(values.actorRole) ?? text(values.role) ?? request.headers.get("x-cn-sales-role"));

  return {
    actorManagedParts,
    approval: {
      workflowGate: text(values.workflowGate),
      actorRole,
      actorId: text(values.actorId),
      part: text(values.part),
      periodStart: text(values.periodStart),
      periodEnd: text(values.periodEnd),
      fileHash: text(values.fileHash),
      normalRows: numberValue(values.normalRows),
      excludedRows: numberValue(values.excludedRows),
      amountTotal: numberValue(values.amountTotal),
      expectedPrimaryScopeRows: numberValue(values.expectedPrimaryScopeRows ?? values.primaryScopeRows),
      expectedExistingScopedRowsBeforeSync: numberValue(values.expectedExistingScopedRowsBeforeSync ?? values.existingScopedRows),
      expectedInsertCandidates: numberValue(values.expectedInsertCandidates ?? values.insertCandidates),
      expectedUpdateCandidates: numberValue(values.expectedUpdateCandidates ?? values.updateCandidates),
      expectedRemovedFromCurrentCandidates: numberValue(values.expectedRemovedFromCurrentCandidates ?? values.removedFromCurrentCandidates),
      expectedNoChangeRows: numberValue(values.expectedNoChangeRows ?? values.noChangeRows),
      expectedAmountBefore: numberValue(values.expectedAmountBefore ?? values.amountBefore),
      expectedAmountAfter: numberValue(values.expectedAmountAfter ?? values.amountAfter),
      expectedAmountDelta: numberValue(values.expectedAmountDelta ?? values.amountDelta),
      rawRowsReturned: false,
    },
    dryRun: {
      part: text(values.part),
      periodStart: text(values.periodStart),
      periodEnd: text(values.periodEnd),
      fileHash: text(values.fileHash),
      primaryScopeRows: numberValue(values.primaryScopeRows ?? values.expectedPrimaryScopeRows),
      existingScopedRows: numberValue(values.existingScopedRows ?? values.expectedExistingScopedRowsBeforeSync),
      insertCandidates: numberValue(values.insertCandidates ?? values.expectedInsertCandidates),
      updateCandidates: numberValue(values.updateCandidates ?? values.expectedUpdateCandidates),
      removedFromCurrentCandidates: numberValue(values.removedFromCurrentCandidates ?? values.expectedRemovedFromCurrentCandidates),
      noChangeRows: numberValue(values.noChangeRows ?? values.expectedNoChangeRows),
      amountBefore: numberValue(values.amountBefore ?? values.expectedAmountBefore),
      amountAfter: numberValue(values.amountAfter ?? values.expectedAmountAfter),
      amountDelta: numberValue(values.amountDelta ?? values.expectedAmountDelta),
      blockedRows: numberValue(values.blockedRows),
      planReady: booleanValue(values.planReady),
      rawRowsReturned: false,
      blockedReasons: [],
    },
  };
}

async function jsonToRecord(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) return {};
  const body = await request.json();
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
}

function formDataToRecord(formData: FormData): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") values[key] = value;
  });
  return values;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string" && value.trim().toLowerCase() === "true") return true;
  if (typeof value === "string" && value.trim().toLowerCase() === "false") return false;
  return undefined;
}
