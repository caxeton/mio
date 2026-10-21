#!/usr/bin/env node
/**
 * Ejecuta sql/schema.sql contra la base de datos definida en DATABASE_URL.
 *
 * Uso:  npm run db:setup
 *
 * No requiere tener psql instalado: usa el driver `pg` de Node.
 * El script es seguro de ejecutar varias veces (el esquema es idempotente).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// Carga .env y .env.local (igual que hace Next.js)
dotenv.config({ path: join(projectRoot, ".env"), quiet: true });
dotenv.config({ path: join(projectRoot, ".env.local"), quiet: true });

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(`${RED}✗ No se encontró DATABASE_URL.${RESET}

Crea un archivo llamado ${YELLOW}.env${RESET} en la raíz del proyecto con esta línea:

  DATABASE_URL=postgres://usuario:password@host.neon.tech/basededatos?sslmode=require

Puedes copiar la plantilla con:  ${DIM}cp .env.example .env${RESET}
La cadena de conexión la obtienes en https://console.neon.tech → tu proyecto → Connect.
`);
  process.exit(1);
}

const schemaPath = join(projectRoot, "sql", "schema.sql");
let schema;
try {
  schema = readFileSync(schemaPath, "utf8");
} catch {
  console.error(`${RED}✗ No se pudo leer ${schemaPath}${RESET}`);
  process.exit(1);
}

// Oculta la contraseña al mostrar a qué host nos conectamos.
function describeTarget(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "(no se pudo interpretar DATABASE_URL)";
  }
}

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 15_000 });

// Al fallar la conexión, Node lanza un AggregateError (un intento por IPv4 y
// otro por IPv6) cuyo `message` viene vacío; el detalle está en `errors`.
function describeError(error) {
  if (error?.message) return error.message;
  if (Array.isArray(error?.errors) && error.errors.length) {
    return error.errors.map((e) => e.message).join("; ");
  }
  return String(error?.code ?? error);
}

try {
  console.log(`${DIM}→ Conectando a ${describeTarget(connectionString)}...${RESET}`);
  await client.connect();

  console.log(`${DIM}→ Ejecutando sql/schema.sql...${RESET}`);
  await client.query(schema);

  const { rows } = await client.query(`
    SELECT 'docker_environments' AS tabla, count(*)::int AS filas FROM docker_environments
    UNION ALL SELECT 'terminal_commands',   count(*)::int FROM terminal_commands
    UNION ALL SELECT 'stress_tests',        count(*)::int FROM stress_tests
    UNION ALL SELECT 'stress_test_samples', count(*)::int FROM stress_test_samples
    UNION ALL SELECT 'snippet_categories',  count(*)::int FROM snippet_categories
    UNION ALL SELECT 'code_snippets',       count(*)::int FROM code_snippets
    ORDER BY tabla
  `);

  console.log(`\n${GREEN}✓ Esquema aplicado correctamente.${RESET}\n`);
  console.table(rows);
  console.log(`Ya puedes levantar la app con:  ${YELLOW}npm run dev${RESET}\n`);
} catch (error) {
  console.error(`\n${RED}✗ Falló la ejecución del esquema.${RESET}\n`);
  console.error(`${RED}${describeError(error)}${RESET}`);

  if (error.position) {
    // Muestra la línea exacta del schema.sql donde está el problema.
    const upToError = schema.slice(0, Number(error.position));
    const line = upToError.split("\n").length;
    console.error(`${DIM}→ Aproximadamente en sql/schema.sql línea ${line}${RESET}`);
  }

  const hints = {
    ENOTFOUND: "El host de la DATABASE_URL no existe. Revisa que copiaste bien la cadena de conexión desde Neon.",
    ECONNREFUSED:
      "No se pudo conectar al servidor. Verifica que la base de datos esté activa (en Neon, o tu Postgres local con `npm run db:up`).",
    ETIMEDOUT: "Timeout de conexión. Revisa tu conexión a internet o si hay un firewall bloqueando.",
    "28P01": "Usuario o contraseña incorrectos en la DATABASE_URL.",
    "3D000": "La base de datos indicada en la DATABASE_URL no existe.",
  };
  const hint = hints[error.code];
  if (hint) console.error(`${YELLOW}→ ${hint}${RESET}`);

  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
