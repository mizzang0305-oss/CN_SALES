import { NextResponse } from "next/server";
import { createImportService } from "@/lib/import/service-factory";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      previewId?: string;
      uploadId?: string;
      operator?: string;
      confirmations?: {
        previewChecked?: boolean;
        partMatchChecked?: boolean;
        rollbackAcknowledged?: boolean;
      };
    };
    const previewId = body.previewId ?? body.uploadId;

    if (!previewId) {
      return NextResponse.json({ status: "rejected", blocked_reasons: ["previewId is required."] }, { status: 400 });
    }

    const { status, service } = await createImportService();
    const result = await service.confirm(previewId, {
      operator: body.operator,
      confirmations: body.confirmations,
    });
    const report = {
      ...result,
      import_batch_id: result.importBatchId ?? result.previewId,
      applied_count: result.appliedCount ?? result.inserted + result.updated,
      rejected_count: result.rejectedCount ?? result.errors + result.missingCandidates,
      operator: result.operator ?? body.operator ?? null,
      created_at: result.createdAt ?? new Date().toISOString(),
      mode: status.mode,
      env_blocked_reasons: status.blockedReasons,
    };
    return NextResponse.json(report, { status: result.status === "rejected" ? 400 : 200 });
  } catch {
    return NextResponse.json(
      {
        status: "rejected",
        blocked_reasons: ["CONFIRM_FAILED"],
      },
      { status: 500 },
    );
  }
}
