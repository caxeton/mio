// Los valores de cada enum se declaran una sola vez como arrays `as const`:
// así sirven tanto de tipo como de lista para validar entradas en la API.
// Deben coincidir con los ENUM definidos en sql/schema.sql.

export const OS_PLATFORMS = ["windows11", "macos", "linux"] as const;
export type OsPlatform = (typeof OS_PLATFORMS)[number];

export const CONTAINER_STATUSES = ["running", "stopped", "restarting", "error", "unknown"] as const;
export type ContainerStatus = (typeof CONTAINER_STATUSES)[number];

export const CACHE_DISTRIBUTIONS = ["uniform", "zipf", "normal", "pareto", "custom"] as const;
export type CacheDistribution = (typeof CACHE_DISTRIBUTIONS)[number];

export const SNIPPET_LANGUAGES = [
  "python",
  "c",
  "cpp",
  "javascript",
  "typescript",
  "bash",
  "sql",
  "go",
  "rust",
  "java",
  "yaml",
  "dockerfile",
  "other",
] as const;
export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

export const isOsPlatform = (value: unknown): value is OsPlatform => isOneOf(OS_PLATFORMS, value);
export const isSnippetLanguage = (value: unknown): value is SnippetLanguage =>
  isOneOf(SNIPPET_LANGUAGES, value);

/** Origen de los datos que está mostrando la app. */
export type DataSource = "neon" | "postgres" | "mock";

export interface PortMapping {
  host: number;
  container: number;
  protocol: "tcp" | "udp";
}

export interface VolumeMapping {
  host: string;
  container: string;
  mode: "ro" | "rw";
}

export interface DockerEnvironment {
  id: string;
  name: string;
  image: string;
  tag: string;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  environment_vars: Record<string, string>;
  network: string | null;
  status: ContainerStatus;
  host_os: OsPlatform | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TerminalCommand {
  id: string;
  environment_id: string | null;
  title: string;
  command: string;
  os_platform: OsPlatform;
  shell: string | null;
  description: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
}

export interface StressTest {
  id: string;
  name: string;
  target_url: string | null;
  request_volume: number;
  concurrency: number;
  distribution: CacheDistribution;
  zipf_exponent: number | null;
  cache_size: number | null;
  duration_ms: number | null;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number | null;
  errors_count: number;
  notes: string | null;
  executed_at: string;
  created_at: string;
}

export interface SnippetCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface CodeSnippet {
  id: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  title: string;
  language: SnippetLanguage;
  code: string;
  description: string | null;
  tags: string[];
  uses_pthreads: boolean;
  complexity_notes: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}
