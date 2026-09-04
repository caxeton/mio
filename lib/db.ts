import { neon } from "@neondatabase/serverless";

/**
 * Cliente SQL de Neon. `null` cuando no hay DATABASE_URL configurada,
 * en cuyo caso lib/data.ts recurre a los datos de ejemplo en memoria
 * para que el dashboard sea usable sin una base real.
 */
export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export const hasDatabase = sql !== null;
