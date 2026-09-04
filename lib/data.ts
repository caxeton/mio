import { sql, hasDatabase } from "./db";
import type {
  DockerEnvironment,
  TerminalCommand,
  StressTest,
  CodeSnippet,
} from "./types";

// ----------------------------------------------------------------------------
// Datos de ejemplo (fallback) — se usan cuando DATABASE_URL no está definida,
// para que el dashboard sea totalmente navegable sin una instancia de Neon.
// Reflejan el mismo seed que sql/schema.sql.
// ----------------------------------------------------------------------------

const MOCK_ENVIRONMENTS: DockerEnvironment[] = [
  {
    id: "env-1",
    name: "neon-local-postgres",
    image: "postgres",
    tag: "16-alpine",
    ports: [{ host: 5432, container: 5432, protocol: "tcp" }],
    volumes: [{ host: "./data/pg", container: "/var/lib/postgresql/data", mode: "rw" }],
    environment_vars: { POSTGRES_USER: "devhub", POSTGRES_DB: "devhub" },
    network: "devhub_net",
    status: "running",
    host_os: "macos",
    description: "Instancia local de Postgres para pruebas antes de desplegar en Neon.",
    created_at: "2026-08-20T10:00:00Z",
    updated_at: "2026-09-03T09:12:00Z",
  },
  {
    id: "env-2",
    name: "redis-cache-bench",
    image: "redis",
    tag: "7.2",
    ports: [{ host: 6379, container: 6379, protocol: "tcp" }],
    volumes: [{ host: "./data/redis", container: "/data", mode: "rw" }],
    environment_vars: {},
    network: "devhub_net",
    status: "running",
    host_os: "windows11",
    description: "Caché usada en el Laboratorio de Rendimiento para pruebas de hit rate.",
    created_at: "2026-08-21T11:30:00Z",
    updated_at: "2026-09-02T18:44:00Z",
  },
  {
    id: "env-3",
    name: "nginx-edge",
    image: "nginx",
    tag: "1.27-alpine",
    ports: [{ host: 8080, container: 80, protocol: "tcp" }],
    volumes: [{ host: "./nginx.conf", container: "/etc/nginx/nginx.conf", mode: "ro" }],
    environment_vars: {},
    network: "devhub_net",
    status: "stopped",
    host_os: "linux",
    description: "Proxy reverso para pruebas de carga contra el laboratorio.",
    created_at: "2026-08-22T08:15:00Z",
    updated_at: "2026-08-30T14:02:00Z",
  },
];

const MOCK_COMMANDS: TerminalCommand[] = [
  {
    id: "cmd-1",
    environment_id: "env-1",
    title: "Listar contenedores activos",
    command: 'docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}"',
    os_platform: "macos",
    shell: "zsh",
    description: "Muestra los contenedores en ejecución con formato tabular.",
    tags: ["docker", "inspeccion"],
    is_favorite: true,
    created_at: "2026-08-20T10:05:00Z",
  },
  {
    id: "cmd-2",
    environment_id: "env-1",
    title: "Listar contenedores activos",
    command: 'docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}"',
    os_platform: "windows11",
    shell: "powershell",
    description: "Equivalente en PowerShell sobre Windows 11.",
    tags: ["docker", "inspeccion"],
    is_favorite: true,
    created_at: "2026-08-20T10:06:00Z",
  },
  {
    id: "cmd-3",
    environment_id: null,
    title: "Liberar puerto ocupado",
    command: "lsof -ti tcp:3000 | xargs kill -9",
    os_platform: "macos",
    shell: "zsh",
    description: "Mata el proceso que ocupa el puerto 3000.",
    tags: ["red", "debug"],
    is_favorite: false,
    created_at: "2026-08-25T09:40:00Z",
  },
  {
    id: "cmd-4",
    environment_id: null,
    title: "Liberar puerto ocupado",
    command:
      "Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force",
    os_platform: "windows11",
    shell: "powershell",
    description: "Equivalente en PowerShell para liberar el puerto 3000.",
    tags: ["red", "debug"],
    is_favorite: false,
    created_at: "2026-08-25T09:41:00Z",
  },
];

const MOCK_STRESS_TESTS: StressTest[] = [
  {
    id: "test-1",
    name: "Bench caché LRU - uniforme",
    target_url: "http://localhost:8080/api/items",
    request_volume: 10000,
    concurrency: 50,
    distribution: "uniform",
    zipf_exponent: null,
    cache_size: 500,
    duration_ms: 42000,
    avg_latency_ms: 4.821,
    p95_latency_ms: 12.4,
    p99_latency_ms: 21.9,
    cache_hits: 4102,
    cache_misses: 5898,
    cache_hit_rate: 41.02,
    errors_count: 0,
    notes: "Distribución uniforme genera baja tasa de aciertos con caché pequeña.",
    executed_at: "2026-09-01T16:00:00Z",
    created_at: "2026-09-01T16:00:00Z",
  },
  {
    id: "test-2",
    name: "Bench caché LRU - zipf",
    target_url: "http://localhost:8080/api/items",
    request_volume: 10000,
    concurrency: 50,
    distribution: "zipf",
    zipf_exponent: 1.2,
    cache_size: 500,
    duration_ms: 39500,
    avg_latency_ms: 3.114,
    p95_latency_ms: 9.2,
    p99_latency_ms: 15.7,
    cache_hits: 8734,
    cache_misses: 1266,
    cache_hit_rate: 87.34,
    errors_count: 0,
    notes: "Distribución zipf concentra accesos en pocas claves, mejora el hit rate.",
    executed_at: "2026-09-02T10:30:00Z",
    created_at: "2026-09-02T10:30:00Z",
  },
  {
    id: "test-3",
    name: "Bench caché LRU - zipf agresivo",
    target_url: "http://localhost:8080/api/items",
    request_volume: 25000,
    concurrency: 100,
    distribution: "zipf",
    zipf_exponent: 1.8,
    cache_size: 500,
    duration_ms: 51200,
    avg_latency_ms: 2.4,
    p95_latency_ms: 6.1,
    p99_latency_ms: 10.3,
    cache_hits: 23875,
    cache_misses: 1125,
    cache_hit_rate: 95.5,
    errors_count: 2,
    notes: "Exponente alto concentra el 90% del tráfico en <5% de las claves.",
    executed_at: "2026-09-03T21:10:00Z",
    created_at: "2026-09-03T21:10:00Z",
  },
];

const MOCK_SNIPPETS: CodeSnippet[] = [
  {
    id: "snip-1",
    category_id: 1,
    category_name: "Concurrencia",
    category_color: "#39ff88",
    title: "Productor-consumidor con pthreads",
    language: "c",
    code: `#include <pthread.h>
#include <stdio.h>

#define BUF_SIZE 8

static int buffer[BUF_SIZE];
static int count = 0;
static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t not_full = PTHREAD_COND_INITIALIZER;
static pthread_cond_t not_empty = PTHREAD_COND_INITIALIZER;

void produce(int item) {
    pthread_mutex_lock(&lock);
    while (count == BUF_SIZE) pthread_cond_wait(&not_full, &lock);
    buffer[count++] = item;
    pthread_cond_signal(&not_empty);
    pthread_mutex_unlock(&lock);
}

int consume(void) {
    pthread_mutex_lock(&lock);
    while (count == 0) pthread_cond_wait(&not_empty, &lock);
    int item = buffer[--count];
    pthread_cond_signal(&not_full);
    pthread_mutex_unlock(&lock);
    return item;
}`,
    description:
      "Implementación clásica del problema productor-consumidor usando mutex y variables de condición POSIX.",
    tags: ["pthreads", "sincronizacion", "c"],
    uses_pthreads: true,
    complexity_notes: "O(1) por operación; bloqueo con mutex + condvars evita busy-waiting.",
    source_url: null,
    created_at: "2026-08-15T12:00:00Z",
    updated_at: "2026-08-15T12:00:00Z",
  },
  {
    id: "snip-2",
    category_id: 2,
    category_name: "Algoritmos",
    category_color: "#3ad4ff",
    title: "Simulador de caché con distribución Zipf",
    language: "python",
    code: `import random

def zipf_keys(n_requests: int, n_keys: int, exponent: float = 1.2) -> list[int]:
    weights = [1 / (rank ** exponent) for rank in range(1, n_keys + 1)]
    total = sum(weights)
    probs = [w / total for w in weights]
    return random.choices(range(n_keys), weights=probs, k=n_requests)

def simulate_cache_hit_rate(keys: list[int], cache_size: int) -> float:
    cache: list[int] = []
    hits = 0
    for key in keys:
        if key in cache:
            hits += 1
            cache.remove(key)
        elif len(cache) >= cache_size:
            cache.pop(0)
        cache.append(key)
    return hits / len(keys) * 100`,
    description:
      "Genera claves siguiendo una distribución Zipf y mide el hit rate de una caché LRU simulada.",
    tags: ["zipf", "cache", "simulacion"],
    uses_pthreads: false,
    complexity_notes:
      "Generación de claves O(n_keys) por muestreo ponderado; simulación O(n_requests * cache_size) en el peor caso.",
    source_url: null,
    created_at: "2026-08-16T09:30:00Z",
    updated_at: "2026-08-16T09:30:00Z",
  },
  {
    id: "snip-3",
    category_id: 3,
    category_name: "Scripts DevOps",
    category_color: "#ffb454",
    title: "Health-check de contenedores en bucle",
    language: "bash",
    code: `#!/usr/bin/env bash
set -euo pipefail

for name in $(docker ps --format '{{.Names}}'); do
  status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "sin healthcheck")
  printf "%-24s %s\\n" "$name" "$status"
done`,
    description: "Recorre los contenedores activos e imprime su estado de healthcheck.",
    tags: ["docker", "bash", "monitoreo"],
    uses_pthreads: false,
    complexity_notes: null,
    source_url: null,
    created_at: "2026-08-18T15:45:00Z",
    updated_at: "2026-08-18T15:45:00Z",
  },
];

// ----------------------------------------------------------------------------
// Fetchers: usan Neon si DATABASE_URL está configurada; si no, devuelven
// los datos de ejemplo de arriba.
// ----------------------------------------------------------------------------

export async function getEnvironments(): Promise<DockerEnvironment[]> {
  if (!sql) return MOCK_ENVIRONMENTS;
  const rows = await sql`
    SELECT id, name, image, tag, ports, volumes, environment_vars,
           network, status, host_os, description, created_at, updated_at
    FROM docker_environments
    ORDER BY created_at DESC
  `;
  return rows as DockerEnvironment[];
}

export async function getCommands(): Promise<TerminalCommand[]> {
  if (!sql) return MOCK_COMMANDS;
  const rows = await sql`
    SELECT id, environment_id, title, command, os_platform, shell,
           description, tags, is_favorite, created_at
    FROM terminal_commands
    ORDER BY is_favorite DESC, created_at DESC
  `;
  return rows as TerminalCommand[];
}

export async function getStressTests(): Promise<StressTest[]> {
  if (!sql) return MOCK_STRESS_TESTS;
  const rows = await sql`
    SELECT id, name, target_url, request_volume, concurrency, distribution,
           zipf_exponent, cache_size, duration_ms, avg_latency_ms,
           p95_latency_ms, p99_latency_ms, cache_hits, cache_misses,
           cache_hit_rate, errors_count, notes, executed_at, created_at
    FROM stress_tests
    ORDER BY executed_at DESC
  `;
  return rows as StressTest[];
}

export async function getSnippets(): Promise<CodeSnippet[]> {
  if (!sql) return MOCK_SNIPPETS;
  const rows = await sql`
    SELECT s.id, s.category_id, c.name AS category_name, c.color AS category_color,
           s.title, s.language, s.code, s.description, s.tags, s.uses_pthreads,
           s.complexity_notes, s.source_url, s.created_at, s.updated_at
    FROM code_snippets s
    LEFT JOIN snippet_categories c ON c.id = s.category_id
    ORDER BY s.created_at DESC
  `;
  return rows as CodeSnippet[];
}
