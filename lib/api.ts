import { NextResponse } from "next/server";
import { MissingTablesError } from "./db";

const NO_STORE = { "Cache-Control": "no-store" };

export function jsonError(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status, headers: NO_STORE });
}

/**
 * Ejecuta el handler de un endpoint de solo lectura y traduce los errores a
 * respuestas JSON coherentes, sin filtrar stack traces ni mensajes internos
 * de la base de datos al cliente.
 */
export async function respond<T>(load: () => Promise<T>) {
  try {
    const data = await load();
    return NextResponse.json({ data }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof MissingTablesError) {
      return jsonError(503, error.message, { hint: "Ejecuta `npm run db:setup`." });
    }
    console.error("[api] Error inesperado:", error);
    return jsonError(500, "Error interno al consultar la base de datos.");
  }
}
