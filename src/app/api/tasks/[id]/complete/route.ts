import { NextResponse } from "next/server";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(
    {
      status: "blocked",
      mode: "fixture_mode",
      taskId: id,
      blocked_reasons: ["Task status changes require approved DB write mode and are blocked in this PR4 shell."],
    },
    { status: 409 },
  );
}
