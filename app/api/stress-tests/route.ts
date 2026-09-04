import { NextResponse } from "next/server";
import { getStressTests } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const tests = await getStressTests();
  return NextResponse.json({ data: tests });
}
