import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

/**
 * Capa de acceso a datos.
 *
 * - Si DATABASE_URL apunta a Neon (*.neon.tech) usa el driver HTTP de Neon,
 *   que es el recomendado para entornos serverless.
 * - Si apunta a cualquier otro Postgres (por ejemplo uno local en Docker),
 *   usa el driver `pg` estándar.
 * - Si no hay DATABASE_URL, `hasDatabase` es false y lib/data.ts usa los
 *   datos de ejemplo en memoria.
 */

const connectionString = process.env.DATABASE_URL;

export const hasDatabase = Boolean(connectionString);

const isNeon = Boolean(connectionString && /\.neon\.tech/i.test(connectionString));

// Se reutiliza el pool entre recargas de módulo en desarrollo para no abrir
// una conexión nueva en cada hot reload.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString,
      // Neon y la mayoría de Postgres gestionados exigen SSL.
      ssl: /sslmode=require|\.neon\.tech/i.test(connectionString ?? "")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
    });
  }
  return globalForDb.pgPool;
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

function isUndefinedTableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  if (code === UNDEFINED_TABLE) return true;
  // El driver HTTP de Neon no siempre propaga `code`, así que revisamos el mensaje.
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && /relation .* does not exist/i.test(message);
}

function extractRelationName(error: unknown): string | undefined {
  const message = (error as { message?: unknown })?.message;
  if (typeof message !== "string") return undefined;
  return message.match(/relation "([^"]+)" does not exist/i)?.[1];
}

/**
 * Ejecuta una consulta y devuelve las filas.
 * Traduce el error "relation does not exist" a MissingTablesError para que
 * la interfaz pueda mostrar instrucciones en vez de un stack trace.
 */
export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  try {
    if (isNeon) {
      // El driver de Neon se puede invocar como función con una query plana
      // (además de su uso como tagged template).
      const sqlClient = neon(connectionString);
      const rows = await sqlClient(sql, []);
      return rows as T[];
    }
    const result = await getPool().query(sql);
    return result.rows as T[];
  } catch (error) {
    if (isUndefinedTableError(error)) {
      throw new MissingTablesError(extractRelationName(error));
    }
    throw error;
  }
}
