import { NextResponse } from "next/server";
import { dataSource, query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Comprobación de estado para monitoreo/despliegues: indica el origen de datos y si responde. */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (dataSource === "mock") {
    return NextResponse.json({ status: "ok", dataSource }, { headers });
  }
  const started = performance.now();
  try {
    await query("SELECT 1");
    const latencyMs = Math.round(performance.now() - started);
    return NextResponse.json({ status: "ok", dataSource, latencyMs }, { headers });
  } catch (error) {
    console.error("[health] La base de datos no responde:", error);
    return NextResponse.json({ status: "error", dataSource }, { status: 503, headers });
  }
}
