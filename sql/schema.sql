-- ============================================================================
-- Hub de Productividad para Desarrolladores — Esquema de base de datos
-- Motor objetivo: Neon (PostgreSQL serverless)
--
-- Es seguro ejecutar este script varias veces: crea lo que falte y no
-- duplica los datos de ejemplo.
--
-- Formas de ejecutarlo:
--   1. npm run db:setup           (recomendada, no requiere psql)
--   2. psql "$DATABASE_URL" -f sql/schema.sql
--   3. Copiar/pegar en el SQL Editor de Neon
-- ============================================================================

BEGIN;

-- Nota: gen_random_uuid() es nativo desde PostgreSQL 13, por lo que no se
-- necesita la extensión pgcrypto.

-- ----------------------------------------------------------------------------
-- Tipos enumerados
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE os_platform AS ENUM ('windows11', 'macos', 'linux');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE container_status AS ENUM ('running', 'stopped', 'restarting', 'error', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cache_distribution AS ENUM ('uniform', 'zipf', 'normal', 'pareto', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE snippet_language AS ENUM (
    'python', 'c', 'cpp', 'javascript', 'typescript', 'bash',
    'sql', 'go', 'rust', 'java', 'yaml', 'dockerfile', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- MÓDULO 1 — GESTOR DE ENTORNOS
-- ============================================================================

-- Documentación de contenedores Docker: imagen, puertos y volúmenes.
CREATE TABLE IF NOT EXISTS docker_environments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(120) NOT NULL,
  image             VARCHAR(255) NOT NULL,          -- p.ej. 'postgres'
  tag               VARCHAR(100) NOT NULL DEFAULT 'latest',
  ports             JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- ports: [{"host": 5432, "container": 5432, "protocol": "tcp"}]
  volumes           JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- volumes: [{"host": "./data/pg", "container": "/var/lib/postgresql/data", "mode": "rw"}]
  environment_vars  JSONB NOT NULL DEFAULT '{}'::jsonb,
  network           VARCHAR(120),
  status            container_status NOT NULL DEFAULT 'stopped',
  host_os           os_platform,                     -- host donde corre habitualmente
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE docker_environments IS 'Contenedores Docker documentados: imagen, puertos, volúmenes y estado.';
COMMENT ON COLUMN docker_environments.ports IS 'Array JSON de mapeos de puertos host/contenedor.';
COMMENT ON COLUMN docker_environments.volumes IS 'Array JSON de volúmenes montados host/contenedor.';

-- Registro de comandos de terminal, diferenciados por sistema operativo.
CREATE TABLE IF NOT EXISTS terminal_commands (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_id    UUID REFERENCES docker_environments(id) ON DELETE SET NULL,
  title             VARCHAR(150) NOT NULL,
  command           TEXT NOT NULL,
  os_platform       os_platform NOT NULL,
  shell             VARCHAR(50),                      -- 'powershell', 'cmd', 'zsh', 'bash'...
  description       TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  is_favorite       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE terminal_commands IS 'Comandos de terminal reutilizables, diferenciados entre Windows 11 y macOS.';

-- ============================================================================
-- MÓDULO 2 — LABORATORIO DE RENDIMIENTO
-- ============================================================================

-- Pruebas de estrés: volumen de peticiones y resultados de hit rate de caché.
CREATE TABLE IF NOT EXISTS stress_tests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(150) NOT NULL,
  target_url        VARCHAR(500),
  request_volume    INTEGER NOT NULL CHECK (request_volume > 0),   -- ej. 10000 consultas
  concurrency       INTEGER NOT NULL DEFAULT 1 CHECK (concurrency > 0),
  distribution      cache_distribution NOT NULL DEFAULT 'uniform', -- uniforme, zipf, etc.
  zipf_exponent     NUMERIC(5,3),                                  -- solo aplica si distribution = 'zipf'
  cache_size        INTEGER,
  duration_ms       INTEGER,
  avg_latency_ms    NUMERIC(10,3),
  p95_latency_ms    NUMERIC(10,3),
  p99_latency_ms    NUMERIC(10,3),
  cache_hits        BIGINT NOT NULL DEFAULT 0,
  cache_misses      BIGINT NOT NULL DEFAULT 0,
  cache_hit_rate    NUMERIC(5,2) CHECK (cache_hit_rate BETWEEN 0 AND 100),
  errors_count      INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  executed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_zipf_exponent CHECK (
    (distribution = 'zipf' AND zipf_exponent IS NOT NULL) OR (distribution <> 'zipf')
  )
);

COMMENT ON TABLE stress_tests IS 'Resultados agregados de pruebas de estrés/carga sobre sistemas con caché.';
COMMENT ON COLUMN stress_tests.request_volume IS 'Cantidad total de peticiones/consultas simuladas en la prueba.';
COMMENT ON COLUMN stress_tests.distribution IS 'Distribución estadística de las claves solicitadas (uniform, zipf, ...).';

-- Muestras individuales opcionales para análisis fino (series de tiempo por prueba).
CREATE TABLE IF NOT EXISTS stress_test_samples (
  id                BIGSERIAL PRIMARY KEY,
  stress_test_id    UUID NOT NULL REFERENCES stress_tests(id) ON DELETE CASCADE,
  sample_index      INTEGER NOT NULL,
  request_key       VARCHAR(255),        -- clave solicitada, útil para inspeccionar zipf/uniform
  was_cache_hit     BOOLEAN NOT NULL,
  latency_ms        NUMERIC(10,3),
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stress_test_id, sample_index)
);

COMMENT ON TABLE stress_test_samples IS 'Muestras individuales de una prueba de estrés (opcional, para análisis detallado).';

-- ============================================================================
-- MÓDULO 3 — REPOSITORIO DE CÓDIGO
-- ============================================================================

CREATE TABLE IF NOT EXISTS snippet_categories (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(100) NOT NULL UNIQUE,
  slug              VARCHAR(100) NOT NULL UNIQUE,
  color             VARCHAR(20) NOT NULL DEFAULT '#39ff88',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE snippet_categories IS 'Categorías para clasificar snippets de código (concurrencia, algoritmos, etc.).';

CREATE TABLE IF NOT EXISTS code_snippets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       INTEGER REFERENCES snippet_categories(id) ON DELETE SET NULL,
  title             VARCHAR(200) NOT NULL,
  language          snippet_language NOT NULL,
  code              TEXT NOT NULL,
  description       TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  uses_pthreads      BOOLEAN NOT NULL DEFAULT false, -- snippets en C con manejo de hilos POSIX
  complexity_notes  TEXT,                            -- notas de complejidad / concurrencia
  source_url        VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE code_snippets IS 'Repositorio de snippets de código categorizados (Python, C con pthreads, etc.).';

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_terminal_commands_os        ON terminal_commands(os_platform);
CREATE INDEX IF NOT EXISTS idx_terminal_commands_env        ON terminal_commands(environment_id);
CREATE INDEX IF NOT EXISTS idx_docker_environments_status   ON docker_environments(status);

CREATE INDEX IF NOT EXISTS idx_stress_tests_distribution    ON stress_tests(distribution);
CREATE INDEX IF NOT EXISTS idx_stress_tests_executed_at     ON stress_tests(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stress_test_samples_test_id  ON stress_test_samples(stress_test_id);

CREATE INDEX IF NOT EXISTS idx_code_snippets_language       ON code_snippets(language);
CREATE INDEX IF NOT EXISTS idx_code_snippets_category       ON code_snippets(category_id);
CREATE INDEX IF NOT EXISTS idx_code_snippets_tags           ON code_snippets USING GIN(tags);

-- ============================================================================
-- TRIGGERS — mantener updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_docker_environments_updated_at ON docker_environments;
CREATE TRIGGER trg_docker_environments_updated_at
  BEFORE UPDATE ON docker_environments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_code_snippets_updated_at ON code_snippets;
CREATE TRIGGER trg_code_snippets_updated_at
  BEFORE UPDATE ON code_snippets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- SEED DATA — datos de ejemplo para probar el esquema de inmediato
--
-- Cada bloque solo inserta si la tabla está vacía, así que volver a ejecutar
-- este script no duplica filas ni falla.
-- ============================================================================

INSERT INTO snippet_categories (name, slug, color) VALUES
  ('Concurrencia',          'concurrencia',        '#39ff88'),
  ('Algoritmos',            'algoritmos',          '#3ad4ff'),
  ('Scripts DevOps',        'devops',              '#ffb454'),
  ('Estructuras de Datos',  'estructuras-datos',   '#ff5f9e')
ON CONFLICT (slug) DO NOTHING;

DO $seed$ BEGIN
IF NOT EXISTS (SELECT 1 FROM docker_environments) THEN
  INSERT INTO docker_environments (name, image, tag, ports, volumes, environment_vars, network, status, host_os, description) VALUES
    (
      'neon-local-postgres', 'postgres', '16-alpine',
      '[{"host": 5432, "container": 5432, "protocol": "tcp"}]'::jsonb,
      '[{"host": "./data/pg", "container": "/var/lib/postgresql/data", "mode": "rw"}]'::jsonb,
      '{"POSTGRES_USER": "devhub", "POSTGRES_DB": "devhub"}'::jsonb,
      'devhub_net', 'running', 'macos',
      'Instancia local de Postgres para pruebas antes de desplegar en Neon.'
    ),
    (
      'redis-cache-bench', 'redis', '7.2',
      '[{"host": 6379, "container": 6379, "protocol": "tcp"}]'::jsonb,
      '[{"host": "./data/redis", "container": "/data", "mode": "rw"}]'::jsonb,
      '{}'::jsonb,
      'devhub_net', 'running', 'windows11',
      'Caché usada en el Laboratorio de Rendimiento para pruebas de hit rate.'
    ),
    (
      'nginx-edge', 'nginx', '1.27-alpine',
      '[{"host": 8080, "container": 80, "protocol": "tcp"}]'::jsonb,
      '[{"host": "./nginx.conf", "container": "/etc/nginx/nginx.conf", "mode": "ro"}]'::jsonb,
      '{}'::jsonb,
      'devhub_net', 'stopped', 'linux',
      'Proxy reverso para pruebas de carga contra el laboratorio.'
    );
END IF;
END $seed$;

DO $seed$
DECLARE
  pg_env UUID := (SELECT id FROM docker_environments WHERE name = 'neon-local-postgres' LIMIT 1);
BEGIN
IF NOT EXISTS (SELECT 1 FROM terminal_commands) THEN
  INSERT INTO terminal_commands (environment_id, title, command, os_platform, shell, description, tags, is_favorite) VALUES
    (pg_env, 'Listar contenedores activos', 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"', 'macos', 'zsh', 'Muestra los contenedores en ejecución con formato tabular.', ARRAY['docker','inspeccion'], true),
    (pg_env, 'Listar contenedores activos (PowerShell)', 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"', 'windows11', 'powershell', 'Equivalente en PowerShell sobre Windows 11.', ARRAY['docker','inspeccion'], true),
    (pg_env, 'Listar contenedores activos (Linux)', 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"', 'linux', 'bash', 'Mismo comando en bash sobre Linux.', ARRAY['docker','inspeccion'], false),
    (NULL, 'Liberar puerto ocupado', 'lsof -ti tcp:3000 | xargs kill -9', 'macos', 'zsh', 'Mata el proceso que ocupa el puerto 3000.', ARRAY['red','debug'], false),
    (NULL, 'Liberar puerto ocupado (Windows)', 'Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }', 'windows11', 'powershell', 'Equivalente en PowerShell; no falla si el puerto ya está libre.', ARRAY['red','debug'], false),
    (NULL, 'Liberar puerto ocupado (Linux)', 'fuser -k 3000/tcp', 'linux', 'bash', 'Equivalente en Linux usando fuser (paquete psmisc).', ARRAY['red','debug'], false);
END IF;
END $seed$;

DO $seed$ BEGIN
IF NOT EXISTS (SELECT 1 FROM stress_tests) THEN
  INSERT INTO stress_tests (name, target_url, request_volume, concurrency, distribution, zipf_exponent, cache_size, duration_ms, avg_latency_ms, p95_latency_ms, p99_latency_ms, cache_hits, cache_misses, cache_hit_rate, errors_count, notes, executed_at) VALUES
    ('Bench caché LRU - uniforme', 'http://localhost:8080/api/items', 10000, 50, 'uniform', NULL, 500, 42000, 4.821, 12.400, 21.900, 4102, 5898, 41.02, 0, 'Distribución uniforme genera baja tasa de aciertos con caché pequeña.', '2026-09-01T16:00:00Z'),
    ('Bench caché LRU - zipf', 'http://localhost:8080/api/items', 10000, 50, 'zipf', 1.200, 500, 39500, 3.114, 9.200, 15.700, 8734, 1266, 87.34, 0, 'Distribución zipf concentra accesos en pocas claves, mejora el hit rate.', '2026-09-02T10:30:00Z'),
    ('Bench caché LRU - zipf agresivo', 'http://localhost:8080/api/items', 25000, 100, 'zipf', 1.800, 500, 51200, 2.400, 6.100, 10.300, 23875, 1125, 95.50, 2, 'Exponente alto concentra el 90% del tráfico en <5% de las claves.', '2026-09-03T21:10:00Z');
END IF;
END $seed$;

DO $seed$ BEGIN
IF NOT EXISTS (SELECT 1 FROM code_snippets) THEN
INSERT INTO code_snippets (category_id, title, language, code, description, tags, uses_pthreads, complexity_notes, source_url)
SELECT
  (SELECT id FROM snippet_categories WHERE slug = 'concurrencia'),
  'Productor-consumidor con pthreads',
  'c'::snippet_language,
  E'#include <pthread.h>\n\n#define BUF_SIZE 8\n\n/* Buffer circular: el consumidor recibe los elementos en orden FIFO. */\nstatic int buffer[BUF_SIZE];\nstatic int head = 0;\nstatic int tail = 0;\nstatic int count = 0;\nstatic pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;\nstatic pthread_cond_t not_full = PTHREAD_COND_INITIALIZER;\nstatic pthread_cond_t not_empty = PTHREAD_COND_INITIALIZER;\n\nvoid produce(int item) {\n    pthread_mutex_lock(&lock);\n    while (count == BUF_SIZE) pthread_cond_wait(&not_full, &lock);\n    buffer[tail] = item;\n    tail = (tail + 1) % BUF_SIZE;\n    count++;\n    pthread_cond_signal(&not_empty);\n    pthread_mutex_unlock(&lock);\n}\n\nint consume(void) {\n    pthread_mutex_lock(&lock);\n    while (count == 0) pthread_cond_wait(&not_empty, &lock);\n    int item = buffer[head];\n    head = (head + 1) % BUF_SIZE;\n    count--;\n    pthread_cond_signal(&not_full);\n    pthread_mutex_unlock(&lock);\n    return item;\n}',
  'Implementación clásica del problema productor-consumidor (cola FIFO acotada) usando mutex y variables de condición POSIX.',
  ARRAY['pthreads','sincronizacion','c'],
  true,
  'O(1) por operación; bloqueo con mutex + condvars evita busy-waiting.',
  NULL
UNION ALL
SELECT
  (SELECT id FROM snippet_categories WHERE slug = 'algoritmos'),
  'Simulador de caché con distribución Zipf',
  'python'::snippet_language,
  E'import random\nfrom collections import OrderedDict\n\ndef zipf_keys(n_requests: int, n_keys: int, exponent: float = 1.2) -> list[int]:\n    # random.choices acepta pesos sin normalizar.\n    weights = [1 / (rank ** exponent) for rank in range(1, n_keys + 1)]\n    return random.choices(range(n_keys), weights=weights, k=n_requests)\n\ndef simulate_cache_hit_rate(keys: list[int], cache_size: int) -> float:\n    if not keys or cache_size <= 0:\n        return 0.0\n    cache: OrderedDict[int, None] = OrderedDict()\n    hits = 0\n    for key in keys:\n        if key in cache:\n            hits += 1\n            cache.move_to_end(key)\n        else:\n            if len(cache) >= cache_size:\n                cache.popitem(last=False)\n            cache[key] = None\n    return hits / len(keys) * 100',
  'Genera claves siguiendo una distribución Zipf y mide el hit rate de una caché LRU simulada.',
  ARRAY['zipf','cache','simulacion'],
  false,
  'Generación O(n_keys + n_requests·log n_keys); simulación LRU O(n_requests) gracias a OrderedDict.',
  NULL
UNION ALL
SELECT
  (SELECT id FROM snippet_categories WHERE slug = 'devops'),
  'Health-check de contenedores en bucle',
  'bash'::snippet_language,
  E'#!/usr/bin/env bash\nset -euo pipefail\n\ndocker ps --format ''{{.Names}}'' | while IFS= read -r name; do\n  status=$(docker inspect --format ''{{if .State.Health}}{{.State.Health.Status}}{{else}}sin healthcheck{{end}}'' "$name")\n  printf "%-24s %s\\n" "$name" "$status"\ndone',
  'Recorre los contenedores activos e imprime su estado de healthcheck.',
  ARRAY['docker','bash','monitoreo'],
  false,
  NULL,
  NULL;
END IF;
END $seed$;

COMMIT;
