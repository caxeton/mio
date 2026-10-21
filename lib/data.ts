import { query, hasDatabase } from "./db";
import {
  MOCK_COMMANDS,
  MOCK_ENVIRONMENTS,
  MOCK_SNIPPETS,
  MOCK_STRESS_TESTS,
} from "./mock-data";
import type {
  CodeSnippet,
  DockerEnvironment,
  OsPlatform,
  SnippetLanguage,
  StressTest,
  TerminalCommand,
} from "./types";

// ----------------------------------------------------------------------------
// Normalización de tipos
//
// PostgreSQL devuelve NUMERIC y BIGINT como *strings* (para no perder
// precisión al pasar por JavaScript). Si no los convertimos, operaciones como
// `valor.toFixed(1)` o `a + b` fallan o concatenan texto en vez de sumar.
// ----------------------------------------------------------------------------

type Row = Record<string, unknown>;

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Igual que toNumber pero nunca devuelve null; útil para contadores. */
export function toNumberOr(value: unknown, fallback: number): number {
  return toNumber(value) ?? fallback;
}

/** Las fechas llegan como Date desde el driver; la UI las espera como string ISO. */
export function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

export function normalizeEnvironment(row: Row): DockerEnvironment {
  return {
    ...(row as unknown as DockerEnvironment),
    ports: Array.isArray(row.ports) ? row.ports : [],
    volumes: Array.isArray(row.volumes) ? row.volumes : [],
    environment_vars:
      row.environment_vars && typeof row.environment_vars === "object"
        ? (row.environment_vars as Record<string, string>)
        : {},
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

export function normalizeCommand(row: Row): TerminalCommand {
  return {
    ...(row as unknown as TerminalCommand),
    is_favorite: row.is_favorite === true,
    tags: toStringArray(row.tags),
    created_at: toIsoString(row.created_at),
  };
}

export function normalizeStressTest(row: Row): StressTest {
  return {
    ...(row as unknown as StressTest),
    request_volume: toNumberOr(row.request_volume, 0),
    concurrency: toNumberOr(row.concurrency, 1),
    zipf_exponent: toNumber(row.zipf_exponent),
    cache_size: toNumber(row.cache_size),
    duration_ms: toNumber(row.duration_ms),
    avg_latency_ms: toNumber(row.avg_latency_ms),
    p95_latency_ms: toNumber(row.p95_latency_ms),
    p99_latency_ms: toNumber(row.p99_latency_ms),
    cache_hits: toNumberOr(row.cache_hits, 0),
    cache_misses: toNumberOr(row.cache_misses, 0),
    cache_hit_rate: toNumber(row.cache_hit_rate),
    errors_count: toNumberOr(row.errors_count, 0),
    executed_at: toIsoString(row.executed_at),
    created_at: toIsoString(row.created_at),
  };
}

export function normalizeSnippet(row: Row): CodeSnippet {
  return {
    ...(row as unknown as CodeSnippet),
    category_id: toNumber(row.category_id),
    category_name: toStringOrNull(row.category_name),
    category_color: toStringOrNull(row.category_color),
    uses_pthreads: row.uses_pthreads === true,
    tags: toStringArray(row.tags),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

// ----------------------------------------------------------------------------
// Fetchers: consultan la base de datos si DATABASE_URL está configurada;
// si no, devuelven los datos de ejemplo de lib/mock-data.ts, ordenados igual
// que el ORDER BY de cada consulta.
//
// Los filtros se aplican en SQL (con parámetros) para no traer filas de más.
// ----------------------------------------------------------------------------

/** Comparador descendente para fechas ISO (que se ordenan bien como texto). */
const newestFirst =
  <K extends string>(key: K) =>
  (a: Record<K, string>, b: Record<K, string>) =>
    b[key].localeCompare(a[key]);

export async function getEnvironments(): Promise<DockerEnvironment[]> {
  if (!hasDatabase) return [...MOCK_ENVIRONMENTS].sort(newestFirst("created_at"));
  const rows = await query<Row>(`
    SELECT id, name, image, tag, ports, volumes, environment_vars,
           network, status, host_os, description, created_at, updated_at
    FROM docker_environments
    ORDER BY created_at DESC
  `);
  return rows.map(normalizeEnvironment);
}

export async function getCommands(filter: { os?: OsPlatform } = {}): Promise<TerminalCommand[]> {
  if (!hasDatabase) {
    return MOCK_COMMANDS.filter((c) => !filter.os || c.os_platform === filter.os).sort(
      (a, b) => Number(b.is_favorite) - Number(a.is_favorite) || newestFirst("created_at")(a, b)
    );
  }
  const rows = await query<Row>(
    `
    SELECT id, environment_id, title, command, os_platform, shell,
           description, tags, is_favorite, created_at
    FROM terminal_commands
    WHERE ($1::os_platform IS NULL OR os_platform = $1::os_platform)
    ORDER BY is_favorite DESC, created_at DESC
  `,
    [filter.os ?? null]
  );
  return rows.map(normalizeCommand);
}

export async function getStressTests(): Promise<StressTest[]> {
  if (!hasDatabase) return [...MOCK_STRESS_TESTS].sort(newestFirst("executed_at"));
  const rows = await query<Row>(`
    SELECT id, name, target_url, request_volume, concurrency, distribution,
           zipf_exponent, cache_size, duration_ms, avg_latency_ms,
           p95_latency_ms, p99_latency_ms, cache_hits, cache_misses,
           cache_hit_rate, errors_count, notes, executed_at, created_at
    FROM stress_tests
    ORDER BY executed_at DESC
  `);
  return rows.map(normalizeStressTest);
}

export async function getSnippets(
  filter: { language?: SnippetLanguage } = {}
): Promise<CodeSnippet[]> {
  if (!hasDatabase) {
    return MOCK_SNIPPETS.filter((s) => !filter.language || s.language === filter.language).sort(
      newestFirst("created_at")
    );
  }
  const rows = await query<Row>(
    `
    SELECT s.id, s.category_id, c.name AS category_name, c.color AS category_color,
           s.title, s.language, s.code, s.description, s.tags, s.uses_pthreads,
           s.complexity_notes, s.source_url, s.created_at, s.updated_at
    FROM code_snippets s
    LEFT JOIN snippet_categories c ON c.id = s.category_id
    WHERE ($1::snippet_language IS NULL OR s.language = $1::snippet_language)
    ORDER BY s.created_at DESC
  `,
    [filter.language ?? null]
  );
  return rows.map(normalizeSnippet);
}
