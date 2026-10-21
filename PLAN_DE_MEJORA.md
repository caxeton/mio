# Plan de mejora — DevHub

Análisis del repositorio original [`caxeton/Ing_soft`](https://github.com/caxeton/Ing_soft)
(commit `5c18fbc`), correcciones aplicadas en este repositorio y hoja de ruta
de lo que queda por hacer.

## 1. Resumen

DevHub es un dashboard en Next.js + PostgreSQL con tres módulos (entornos
Docker, laboratorio de rendimiento de caché y repositorio de snippets). La base
era ordenada y bien documentada, pero tenía:

- **Una vulnerabilidad crítica de seguridad**: Next.js 14.2.35 (rama sin
  soporte) arrastraba más de 20 avisos, incluida ejecución remota de código.
- **Errores de lógica visibles para el usuario**: métricas mal calculadas,
  una etiqueta fija que podía mentir y snippets de ejemplo incorrectos.
- **Fragilidad operativa**: un error en una conexión inactiva podía tumbar el
  proceso, la API devolvía stack traces y no había pantalla de error.
- **Cero red de seguridad**: sin tests, sin CI y con el lint sin configurar.

Todo lo anterior quedó corregido y verificado (ver §4). Lo pendiente son
mejoras de producto y de arquitectura (ver §5).

### Antes y después

| Métrica                                   | Original                     | Ahora                         |
| ----------------------------------------- | ---------------------------- | ----------------------------- |
| Vulnerabilidades en dependencias de prod. | 1 crítica + 2 altas          | **0**                         |
| Versión de Next.js / React                | 14.2 (sin soporte) / 18      | 16.4.2 / 19.3                 |
| Tests automatizados                       | 0                            | **41** (Vitest)               |
| Lint                                      | sin configuración            | ESLint 9, 0 problemas         |
| CI                                        | no                           | GitHub Actions                |
| Consultas parametrizadas                  | no soportadas                | todas                         |
| Datos de ejemplo = seed SQL               | no (4 tablas desalineadas)   | sí, verificado por test       |
| Navegación en móvil                       | ninguna                      | barra de navegación propia    |

## 2. Cómo se hizo el análisis

1. Lectura completa del código (30 archivos).
2. `tsc --noEmit`, ESLint, `npm audit` y `next build` sobre el original.
3. Ejecución real del esquema SQL contra PostgreSQL 17 (dos veces, para
   comprobar idempotencia) y comparación byte a byte con los datos de ejemplo.
4. Compilación y ejecución de los snippets de código del seed (C con
   `-Wall -Wextra -Werror` y un test FIFO con dos hilos; Python con casos de
   prueba LRU; `bash -n`).
5. Prueba de la app en el navegador (escritorio y 375 px), de cada endpoint y
   de los caminos de error: base vacía, base caída y parámetros inválidos
   (incluido un intento de inyección SQL).

## 3. Diagnóstico

Severidad: 🔴 crítica · 🟠 alta · 🟡 media · ⚪ baja. Estado: ✅ corregido · 📋 pendiente (§5).

### 3.1 Seguridad

| # | Hallazgo | Sev. | Estado |
|---|----------|------|--------|
| S1 | **Next.js 14.2.35** con 23 avisos de seguridad (RCE en Windows y en el optimizador de imágenes, SSRF, cache poisoning, DoS). La rama 14 ya no recibe parches; el arreglo exige Next ≥ 16.4.2. | 🔴 | ✅ Next 16.4.2 + React 19 |
| S2 | `ssl: { rejectUnauthorized: false }` en `lib/db.ts`: desactiva la verificación del certificado y expone la conexión a *man-in-the-middle*. | 🟠 | ✅ SSL vía `sslmode` en la URL, con verificación |
| S3 | `query()` no aceptaba parámetros: cualquier filtro futuro tendría que concatenar texto en SQL (inyección). | 🟠 | ✅ `query(sql, params)` y filtros en SQL con `$1` |
| S4 | La API devolvía errores 500 con el detalle interno de la base de datos. | 🟡 | ✅ `lib/api.ts`: 400/503/500 sin filtrar internos |
| S5 | Sin cabeceras de seguridad y con `X-Powered-By` expuesto. | 🟡 | ✅ `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` |
| S6 | Detección de Neon con una regex sobre la URL completa (una contraseña con `.neon.tech` cambiaba el driver). | ⚪ | ✅ Se compara el *hostname* |
| S7 | **Sin autenticación**: si se despliega, cualquiera ve la infraestructura documentada. `/api/environments` devuelve `environment_vars` completas, donde es fácil terminar guardando secretos. | 🟠 | 📋 Fase 1 |
| S8 | Sin Content-Security-Policy ni límite de peticiones en la API. | 🟡 | 📋 Fase 1 |
| S9 | Vulnerabilidades solo de desarrollo (`braces`/`micromatch` vía Tailwind 3 y `eslint-config-next`). No llegan al bundle de producción. | ⚪ | 📋 Fase 1 |

### 3.2 Errores de lógica

| # | Hallazgo | Sev. | Estado |
|---|----------|------|--------|
| B1 | La tarjeta **"Mejor hit rate"** decía siempre "distribución zipf", aunque la mejor prueba fuera uniforme. | 🟡 | ✅ Muestra el nombre y la distribución reales |
| B2 | El **hit rate promedio** era un promedio simple (una prueba de 1.000 peticiones pesaba igual que una de 1.000.000) y contaba como 0 % las pruebas sin resultado. Con los datos de ejemplo daba 74,6 %; el valor correcto es 81,6 %. | 🟡 | ✅ `weightedHitRate` ponderado por volumen |
| B3 | El contador de comandos por SO ignoraba Linux. | ⚪ | ✅ |
| B4 | **Snippet C "productor-consumidor clásico"**: `buffer[count++]` / `buffer[--count]` es una **pila (LIFO)**, no una cola; el consumidor recibía primero lo último producido. Además incluía `stdio.h` sin usarlo. | 🟡 | ✅ Buffer circular FIFO, probado con 2 hilos |
| B5 | **Snippet Python LRU**: usaba una lista (`in`, `remove`, `pop(0)` son O(n)) → simulación O(n·cache_size); fallaba con `ZeroDivisionError` con una lista vacía. | 🟡 | ✅ `OrderedDict`, O(n), con caso vacío |
| B6 | **Snippet bash**: `for name in $(docker ps ...)` parte por espacios; el fallback de healthcheck dependía de que `docker inspect` fallara. | ⚪ | ✅ `while read` + plantilla `{{if .State.Health}}` |
| B7 | **Comando PowerShell** para liberar el puerto: fallaba si el puerto estaba libre o con varias conexiones. | ⚪ | ✅ `-State Listen -ErrorAction SilentlyContinue`, únicos |
| B8 | `toNumber("")` devolvía `0` en vez de `null`. | ⚪ | ✅ |
| B9 | `npm run db:setup` mostraba un **mensaje de error vacío** cuando el servidor rechazaba la conexión (Node lanza un `AggregateError` IPv4/IPv6 sin `message`), y la pista siempre hablaba de Neon. | 🟡 | ✅ |

### 3.3 Datos y base de datos

| # | Hallazgo | Sev. | Estado |
|---|----------|------|--------|
| D1 | **Los datos de ejemplo no coincidían con el seed SQL** pese a que el código decía que sí: 3 vs 2 entornos, 3 vs 2 pruebas, 3 vs 2 snippets y títulos de comandos distintos. La app se veía distinta con y sin base de datos. | 🟡 | ✅ Alineados + test que falla si se vuelven a desalinear |
| D2 | El seed no enlazaba los comandos con su entorno (`environment_id` siempre NULL). | ⚪ | ✅ |
| D3 | El orden de las pruebas era indeterminado (todas con `executed_at = now()`) y el modo demo no ordenaba igual que el SQL. | ⚪ | ✅ |
| D4 | Los filtros de la API traían todas las filas y filtraban en memoria. | ⚪ | ✅ `WHERE` parametrizado |
| D5 | La tabla `stress_test_samples` existe pero ninguna parte de la app la usa. | ⚪ | 📋 Fase 2 |
| D6 | `cache_hit_rate` se guarda aparte de `cache_hits`/`cache_misses` sin restricción de coherencia. | ⚪ | 📋 Fase 3 |
| D7 | `schema.sql` mezcla DDL y datos de ejemplo y no tiene versionado de migraciones. | 🟡 | 📋 Fase 3 |

### 3.4 Robustez

| # | Hallazgo | Sev. | Estado |
|---|----------|------|--------|
| R1 | El `Pool` de `pg` no tenía listener de `error`: si el servidor cerraba una conexión inactiva, el evento no manejado **tumbaba el proceso de Node**. | 🟠 | ✅ (verificado apagando la base con la app corriendo) |
| R2 | El cliente de Neon se creaba de nuevo en cada consulta. | ⚪ | ✅ Reutilizado |
| R3 | Si la base de datos no respondía, se mostraba la página de error genérica de Next. | 🟡 | ✅ `app/error.tsx` con "Reintentar" + `app/loading.tsx` |
| R4 | Sin endpoint de salud para monitoreo/despliegues. | ⚪ | ✅ `GET /api/health` |
| R5 | Sin timeouts de conexión. | ⚪ | ✅ |

### 3.5 Interfaz y accesibilidad

| # | Hallazgo | Sev. | Estado |
|---|----------|------|--------|
| U1 | **En móvil no había navegación** (la sidebar se oculta bajo 1024 px y no había alternativa). | 🟡 | ✅ `MobileNav` |
| U2 | Las fuentes JetBrains Mono / Inter se declaraban pero nunca se cargaban (se veía la fuente del sistema). | ⚪ | ✅ `next/font` |
| U3 | Botones sin `type` ni `aria-pressed`, buscador sin etiqueta, tablas sin `scope`/`caption`, iconos decorativos leídos por lectores de pantalla, sin enlace "saltar al contenido". | 🟡 | ✅ |
| U4 | El reloj usaba `suppressHydrationWarning` para tapar un desajuste de hidratación. | ⚪ | ✅ `useSyncExternalStore` |
| U5 | No se podía copiar un comando o snippet con un clic. | ⚪ | ✅ `CopyButton` |
| U6 | La tabla de rendimiento ocultaba latencia promedio y errores; el indicador de BD decía "NEON" aunque fuera otro Postgres. | ⚪ | ✅ |
| U7 | Nombres e imágenes se partían en varias líneas en la tabla de contenedores. | ⚪ | ✅ |
| U8 | La búsqueda de snippets no miraba la descripción. | ⚪ | ✅ |
| U9 | Sin resaltado de sintaxis en los snippets. | ⚪ | 📋 Fase 2 |

### 3.6 Calidad y mantenibilidad

| # | Hallazgo | Sev. | Estado |
|---|----------|------|--------|
| Q1 | Sin tests. | 🟠 | ✅ 41 tests (normalización, estadísticas, BD, API, coherencia seed) |
| Q2 | `npm run lint` (`next lint`) sin archivo de configuración; además `next lint` desaparece en Next 16. Había 1 error y 1 aviso latentes. | 🟡 | ✅ ESLint 9 flat config, 0 problemas |
| Q3 | Sin CI. | 🟡 | ✅ typecheck, lint, tests, esquema ×2 en Postgres real, build y audit |
| Q4 | Enums duplicados a mano entre tipos y validación. | ⚪ | ✅ Arrays `as const` como única fuente |
| Q5 | Cálculos de negocio dentro de los componentes (no testeables). | ⚪ | ✅ `lib/stats.ts` |
| Q6 | Configuración muerta en Tailwind (`bg-grid`, animación `scan`, `darkMode`) y versión fija `v0.1.0` en la sidebar. | ⚪ | ✅ |
| Q7 | `README` decía que existía un Postgres local en Docker, pero no había `docker-compose.yml`. | ⚪ | ✅ `npm run db:up` |
| Q8 | Casts `as unknown as Tipo` sobre las filas de la BD: no hay validación en tiempo de ejecución. | 🟡 | 📋 Fase 3 |

## 4. Cambios aplicados (resumen por archivo)

- **Dependencias** (`package.json`): Next 16.4.2, React 19.3, Neon 1.2,
  ESLint 9, Vitest; `engines.node >= 22.12`; scripts `test`, `check`, `db:up`.
- **`lib/db.ts`**: consultas parametrizadas, clientes reutilizados, listener
  de errores del pool, timeouts, SSL verificado, detección por hostname,
  `dataSource` (`neon` / `postgres` / `mock`).
- **`lib/data.ts`**: normalizadores exportados y testeados, filtros en SQL,
  modo demo con el mismo orden que SQL.
- **`lib/mock-data.ts`** (nuevo): datos de ejemplo idénticos al seed.
- **`lib/stats.ts`** (nuevo): hit rate ponderado, mejor prueba, conteos.
- **`lib/api.ts`** (nuevo) y **`app/api/*`**: validación de parámetros,
  códigos HTTP correctos, `Cache-Control: no-store`, nuevo `/api/health`.
- **`sql/schema.sql`**: seed completo y alineado, snippets corregidos,
  comandos Linux, enlaces a entornos y fechas deterministas.
- **`scripts/setup-db.mjs`**: mensajes de error útiles y timeout.
- **Componentes**: navegación móvil, `FilterChip`, `CopyButton`, accesibilidad,
  columnas nuevas en rendimiento, `error.tsx` y `loading.tsx`.
- **Configuración**: cabeceras de seguridad, `next/font`, ESLint flat config,
  Vitest, CI, `docker-compose.yml`, `.env.example` con ambas opciones.

## 5. Hoja de ruta pendiente

### Fase 1 — Seguridad antes de desplegar (prioridad alta, ~1 semana)

1. **Autenticación** (S7). Proteger toda la app y la API: Auth.js con el
   proveedor de la organización (GitHub/Google), o como mínimo la protección
   de despliegue de la plataforma. *Criterio de aceptación:* ninguna ruta
   responde datos sin sesión.
2. **No exponer secretos** (S7). Enmascarar los valores de `environment_vars`
   en la API (`POSTGRES_PASSWORD: "••••"`) y documentar que no se guarden
   secretos ahí; idealmente, guardar solo los nombres de las variables.
3. **CSP con nonce** y **rate limiting** de `/api/*` (S8), p. ej. con
   `proxy.ts` de Next 16 y un almacén tipo Upstash/Redis.
4. **Tailwind 4** (S9): `npx @tailwindcss/upgrade`, mover el tema a `@theme`
   en CSS y comparar capturas antes/después. Elimina la mayoría de los avisos
   de desarrollo; el resto depende de que `eslint-config-next` actualice
   `fast-glob`.

### Fase 2 — Producto (~2–4 semanas)

1. **Escritura (CRUD)** de entornos, comandos y snippets con Server Actions,
   validación con Zod y confirmación al borrar. Requiere la Fase 1.
2. **Laboratorio de rendimiento real**: lanzar pruebas desde la app (worker
   con `autocannon`/`k6`), guardar muestras en `stress_test_samples` (D5) y
   graficar latencia y hit rate en el tiempo.
3. **Comparar pruebas** (p. ej. uniforme vs zipf con el mismo tamaño de caché).
4. **Resaltado de sintaxis** con Shiki renderizado en servidor (U9).
5. **Filtros en la URL** (`?os=linux&q=docker`) para compartir vistas.
6. **Paginación** en API y UI cuando crezcan los datos.
7. Generar un `docker run` / fragmento de `docker-compose` desde cada entorno
   documentado.

### Fase 3 — Arquitectura y escala (continuo)

1. **Migraciones versionadas** (D7) con `drizzle-kit` o `node-pg-migrate`;
   separar `schema` de `seed`.
2. **Capa de datos tipada** (Q8) con Drizzle o Kysely y validación de filas
   con Zod, eliminando los `as unknown as`.
3. **Coherencia de datos** (D6): `cache_hit_rate` como columna generada a
   partir de `cache_hits` y `cache_misses`, y `CHECK (cache_hits +
   cache_misses <= request_volume)`.
4. **Caché**: reemplazar `force-dynamic` por revalidación o los *Cache
   Components* de Next 16 en lo que cambia poco (snippets, entornos).
5. **Observabilidad**: logs estructurados, Sentry u OpenTelemetry, alertas
   sobre `/api/health`.
6. **Tests E2E** con Playwright (filtros, copiar, pantallas de error) y
   umbral de cobertura en la CI.
7. **Dockerfile** de la app (`output: "standalone"`) para desplegar fuera de
   Vercel.

## 6. Cómo verificarlo

```bash
npm install
npm run check        # typecheck + lint + 41 tests
npm run build
npm audit --omit=dev # 0 vulnerabilidades
```

Con Docker: `npm run db:up`, poner
`DATABASE_URL=postgres://devhub:devhub@localhost:5432/devhub` en `.env`,
`npm run db:setup` (dos veces, para ver que es idempotente) y `npm run dev`.
