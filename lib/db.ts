import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { Pool } from "pg";
import type { DataSource } from "./types";

/**
 * Capa de acceso a datos.
 *
 * - Si DATABASE_URL apunta a Neon (host *.neon.tech) usa el driver HTTP de
 *   Neon, que es el recomendado para entornos serverless.
 * - Si apunta a cualquier otro Postgres (por ejemplo uno local en Docker),
 *   usa el driver `pg` estándar.
 * - Si no hay DATABASE_URL, `hasDatabase` es false y lib/data.ts usa los
 *   datos de ejemplo en memoria.
 */

const connectionString = process.env.DATABASE_URL?.trim() || undefined;

export const hasDatabase = Boolean(connectionString);

/** Compara contra el hostname real (no contra la URL completa, que incluye la contraseña). */
export function isNeonUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.toLowerCase().endsWith(".neon.tech");
  } catch {
    return false;
  }
}

const isNeon = isNeonUrl(connectionString);

export const dataSource: DataSource = !connectionString ? "mock" : isNeon ? "neon" : "postgres";

// Clientes reutilizados entre peticiones y entre recargas de módulo en
// desarrollo, para no abrir una conexión nueva en cada hot reload.
const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  neonSql?: NeonQueryFunction<false, false>;
};

function getPool(url: string): Pool {
  if (!globalForDb.pgPool) {
    // El SSL se controla con `sslmode` en la propia URL (p. ej. ?sslmode=require).
    // No se desactiva la verificación del certificado: hacerlo expone la
    // conexión a ataques man-in-the-middle.
    const pool = new Pool({
      connectionString: url,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    // Sin este listener, un error en una conexión inactiva (p. ej. el servidor
    // la cierra) se emite como evento no manejado y tumba el proceso de Node.
    pool.on("error", (error) => {
      console.error("[db] Error en una conexión inactiva del pool:", error.message);
    });
    globalForDb.pgPool = pool;
  }
  return globalForDb.pgPool;
}

function getNeon(url: string): NeonQueryFunction<false, false> {
  globalForDb.neonSql ??= neon(url);
  return globalForDb.neonSql;
}

/** Error lanzado cuando el esquema todavía no se aplicó a la base de datos. */
export class MissingTablesError extends Error {
  constructor(public readonly relation?: string) {
    super(
      relation
        ? `La tabla "${relation}" no existe en la base de datos.`
        : "Las tablas del esquema no existen en la base de datos."
    );
    this.name = "MissingTablesError";
  }
}

/** Código de error de PostgreSQL para "undefined_table". */
const UNDEFINED_TABLE = "42P01";

export function isUndefinedTableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  if (code === UNDEFINED_TABLE) return true;
  // Por si algún driver no propaga `code`, revisamos también el mensaje.
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && /relation .* does not exist/i.test(message);
}

export function extractRelationName(error: unknown): string | undefined {
  const message = (error as { message?: unknown })?.message;
  if (typeof message !== "string") return undefined;
  return message.match(/relation "([^"]+)" does not exist/i)?.[1];
}

/**
 * Ejecuta una consulta parametrizada ($1, $2, ...) y devuelve las filas.
 * Los valores SIEMPRE deben pasarse en `params`, nunca concatenados en `sql`.
 *
 * Traduce el error "relation does not exist" a MissingTablesError para que
 * la interfaz pueda mostrar instrucciones en vez de un stack trace.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  try {
    if (isNeon) {
      const rows = await getNeon(connectionString).query(sql, params);
      return rows as T[];
    }
    const result = await getPool(connectionString).query(sql, params);
    return result.rows as T[];
  } catch (error) {
    if (isUndefinedTableError(error)) {
      throw new MissingTablesError(extractRelationName(error));
    }
    throw error;
  }
}
