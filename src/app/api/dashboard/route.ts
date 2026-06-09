import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/import/service-factory";

export async function GET() {
  return NextResponse.json(await getDashboardData());
}
