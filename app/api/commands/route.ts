import { NextResponse } from "next/server";
import { getCommands } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const os = searchParams.get("os");

  const commands = await getCommands();
  const filtered = os ? commands.filter((c) => c.os_platform === os) : commands;

  return NextResponse.json({ data: filtered });
}
