# DevHub — Hub de Productividad para Desarrolladores

Dashboard interno, denso en información y con estética de terminal (dark mode
nativo, grises carbón + acentos neón), para documentar entornos Docker,
correr y registrar pruebas de rendimiento de caché, y mantener un repositorio
de snippets de código.

> El análisis del código, la lista de correcciones aplicadas y la hoja de ruta
> pendiente están en [`PLAN_DE_MEJORA.md`](PLAN_DE_MEJORA.md).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3.4** con tema personalizado (`carbon` / `neon`) — ver `tailwind.config.ts`
- **PostgreSQL**: Neon (serverless) vía `@neondatabase/serverless`, o cualquier
  Postgres vía `pg`
- **Vitest** para tests, **ESLint 9** (flat config) para lint
- Tipografías JetBrains Mono / Inter servidas con `next/font`

Requiere **Node.js 22.12 o superior**.

Si `DATABASE_URL` no está configurada, la app funciona igual usando datos de
ejemplo en memoria (`lib/mock-data.ts`), para poder revisar la interfaz sin una
base de datos real.

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Elegir una base de datos y crear el archivo `.env`:

   ```bash
   cp .env.example .env
   ```

   - **Neon**: crear un proyecto en [Neon](https://console.neon.tech), copiar
     la cadena de conexión (botón **Connect**) y pegarla en `DATABASE_URL`.
   - **Postgres local en Docker**: ejecutar `npm run db:up` y usar
     `DATABASE_URL=postgres://devhub:devhub@localhost:5432/devhub`.

3. Aplicar el esquema a la base de datos:

   ```bash
   npm run db:setup
   ```

   Esto ejecuta `sql/schema.sql` usando la `DATABASE_URL` del `.env`. **No
   requiere tener `psql` instalado.** Es seguro ejecutarlo varias veces: crea
   lo que falte y no duplica los datos de ejemplo.

   > Alternativas: `psql "$DATABASE_URL" -f sql/schema.sql`, o copiar y pegar
   > el contenido de `sql/schema.sql` en el SQL Editor de la consola de Neon.

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000). En la barra superior
   derecha, el indicador muestra `NEON::CONNECTED` o `POSTGRES::CONNECTED`
   según la base de datos, o `MOCK_DATA` cuando no hay `DATABASE_URL`.

   Si las tablas todavía no existen, la app no falla: muestra una pantalla
   indicando que hay que ejecutar `npm run db:setup`. Si la base de datos no
   responde, muestra una pantalla de error con opción de reintentar.

## Scripts

| Script               | Qué hace                                                   |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                                     |
| `npm run build`      | Build de producción                                        |
| `npm start`          | Sirve el build de producción                               |
| `npm run db:up`      | Levanta Postgres local con Docker (`docker-compose.yml`)   |
| `npm run db:setup`   | Aplica `sql/schema.sql` (idempotente)                      |
| `npm run typecheck`  | Verificación de tipos con `tsc`                            |
| `npm run lint`       | ESLint                                                     |
| `npm test`           | Tests con Vitest                                           |
| `npm run check`      | typecheck + lint + tests                                   |

La CI (`.github/workflows/ci.yml`) ejecuta todo lo anterior, aplica el esquema
dos veces contra un Postgres real y falla si hay vulnerabilidades altas en las
dependencias de producción.

## API

Endpoints REST de solo lectura. Responden `{ "data": [...] }`, o
`{ "error": "..." }` con el código HTTP correspondiente.

| Endpoint                          | Filtros opcionales                         |
| --------------------------------- | ------------------------------------------ |
| `GET /api/environments`           | —                                          |
| `GET /api/commands`               | `?os=windows11\|macos\|linux`              |
| `GET /api/stress-tests`           | —                                          |
| `GET /api/snippets`               | `?language=python\|c\|bash\|...`           |
| `GET /api/health`                 | Estado y latencia de la base de datos      |

Un filtro con un valor no válido responde `400` con la lista de valores
permitidos; si falta el esquema, `503`.

## Base de datos soportada

La capa de acceso (`lib/db.ts`) detecta automáticamente el destino según el
hostname de `DATABASE_URL`:

- `*.neon.tech` → usa el driver HTTP de `@neondatabase/serverless` (recomendado
  para despliegues serverless).
- Cualquier otro Postgres (por ejemplo uno local en Docker) → usa el driver
  `pg` estándar. El SSL se configura con `sslmode` en la URL.

Todas las consultas son parametrizadas (`$1`, `$2`, ...) y los filtros se
aplican en SQL.

## Estructura

```
sql/schema.sql              Esquema completo, idempotente, con datos de ejemplo
scripts/setup-db.mjs        Aplica el esquema sin necesidad de psql
docker-compose.yml          Postgres local para desarrollo
lib/db.ts                   Conexión (Neon HTTP o pg) + MissingTablesError
lib/data.ts                 Fetchers y normalización de tipos
lib/mock-data.ts            Datos de ejemplo (idénticos al seed SQL)
lib/stats.ts                Cálculos del dashboard (hit rate ponderado, etc.)
lib/api.ts                  Respuestas y manejo de errores de la API
lib/types.ts                Tipos y enums alineados al esquema SQL
app/page.tsx                Dashboard principal (Overview + 3 módulos)
app/error.tsx, loading.tsx  Pantallas de error y de carga
app/api/*/route.ts          Endpoints REST de solo lectura
components/layout/          Sidebar, navegación móvil y barra superior
components/dashboard/       Los tres módulos core del panel
components/ui/              Panel, Badge, FilterChip, CopyButton
tests/                      Tests de Vitest
```

### Nota sobre tipos numéricos

PostgreSQL devuelve las columnas `NUMERIC` y `BIGINT` como *strings* para no
perder precisión. `lib/data.ts` los convierte a números antes de entregarlos a
la interfaz; sin esa conversión, operaciones como `cache_hit_rate.toFixed(1)`
fallarían y los promedios concatenarían texto en vez de sumar.

## Módulos

1. **Gestor de Entornos** — tabla `docker_environments` (imagen, puertos,
   volúmenes, estado) y `terminal_commands`, filtrable por sistema operativo
   (Windows 11 / macOS / Linux), con botón para copiar cada comando.
2. **Laboratorio de Rendimiento** — `stress_tests`: volumen de peticiones,
   concurrencia, distribución (`uniform`, `zipf`, ...), latencias, errores y
   hit rate de caché (el global se pondera por volumen de peticiones), con
   detalle opcional en `stress_test_samples`.
3. **Repositorio de Código** — `code_snippets` categorizados
   (`snippet_categories`), desde rutinas en Python hasta implementaciones en C
   con hilos POSIX (`uses_pthreads`), con búsqueda y botón de copiar.
