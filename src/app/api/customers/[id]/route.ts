import { NextResponse } from "next/server";
import { customerDetails } from "@/lib/data/mock";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = customerDetails[id];

  if (!customer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}
