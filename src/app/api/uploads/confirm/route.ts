import { NextResponse } from "next/server";
import { createImportService } from "@/lib/import/service-factory";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      previewId?: string;
      uploadId?: string;
    };
    const previewId = body.previewId ?? body.uploadId;

    if (!previewId) {
      return NextResponse.json({ status: "rejected", blocked_reasons: ["previewId is required."] }, { status: 400 });
    }

    const { status, service } = await createImportService();
    const result = await service.confirm(previewId);
    return NextResponse.json({ ...result, mode: status.mode, env_blocked_reasons: status.blockedReasons }, { status: result.status === "rejected" ? 400 : 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "rejected",
        blocked_reasons: [error instanceof Error ? error.message : "Confirm failed."],
      },
      { status: 500 },
    );
  }
}
