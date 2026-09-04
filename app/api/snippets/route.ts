import { NextResponse } from "next/server";
import { getSnippets } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language");

  const snippets = await getSnippets();
  const filtered = language ? snippets.filter((s) => s.language === language) : snippets;

  return NextResponse.json({ data: filtered });
}
