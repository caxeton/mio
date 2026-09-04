import { NextResponse } from "next/server";
import { getEnvironments } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const environments = await getEnvironments();
  return NextResponse.json({ data: environments });
}
