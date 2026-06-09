import { NextResponse } from "next/server";
import { createImportService, parseRowsFromJson } from "@/lib/import/service-factory";
import type { LedgerRawRow } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "file_required", blocked_reasons: ["Upload file is required."] }, { status: 400 });
      }

      const { status, service } = await createImportService();
      const preview = await service.preview({
        file,
        partCode: String(formData.get("partCode") ?? "A"),
        periodStart: String(formData.get("periodStart") ?? "2026-06-01"),
        periodEnd: String(formData.get("periodEnd") ?? "2026-06-30"),
      });

      return NextResponse.json({ ...preview, mode: status.mode, blocked_reasons: status.blockedReasons });
    }

    const body = (await request.json()) as {
      fileName?: string;
      partCode?: string;
      periodStart?: string;
      periodEnd?: string;
      rows?: LedgerRawRow[];
    };
    const file = new File([JSON.stringify(body.rows ?? [])], body.fileName ?? "ledger.json", {
      type: "application/json",
    });
    const { status, service } = await createImportService(parseRowsFromJson(body.rows ?? []));
    const preview = await service.preview({
      file,
      partCode: body.partCode ?? "A",
      periodStart: body.periodStart ?? "2026-06-01",
      periodEnd: body.periodEnd ?? "2026-06-30",
    });

    return NextResponse.json({ ...preview, mode: status.mode, blocked_reasons: status.blockedReasons });
  } catch (error) {
    return NextResponse.json(
      {
        error: "preview_failed",
        blocked_reasons: [error instanceof Error ? error.message : "Preview failed."],
      },
      { status: 500 },
    );
  }
}
