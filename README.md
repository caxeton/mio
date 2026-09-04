# DevHub — Hub de Productividad para Desarrolladores

Dashboard interno, denso en información y con estética de terminal (dark mode
nativo, grises carbón + acentos neón), para documentar entornos Docker,
correr y registrar pruebas de rendimiento de caché, y mantener un repositorio
de snippets de código.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** con tema personalizado (`carbon` / `neon`) — ver `tailwind.config.ts`
- **Neon** (PostgreSQL serverless) vía `@neondatabase/serverless`
- Tipografía monoespaciada para tablas, comandos y bloques de código

Si `DATABASE_URL` no está configurada, la app funciona igual usando datos de
ejemplo en memoria (`lib/data.ts`), para poder revisar la interfaz sin una
base de datos real.

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un proyecto en [Neon](https://console.neon.tech) y copiar la cadena de
   conexión (botón **Connect**). Luego crear el archivo `.env`:

   ```bash
   cp .env.example .env
   ```

   y pegar la cadena en `DATABASE_URL`.

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
   derecha, el indicador muestra `NEON::CONNECTED` cuando está leyendo de la
   base de datos real, o `NEON::MOCK_DATA` cuando no hay `DATABASE_URL` y está
   usando los datos de ejemplo en memoria.

   Si las tablas todavía no existen, la app no falla: muestra una pantalla
   indicando que hay que ejecutar `npm run db:setup`.

## Base de datos soportada

La capa de acceso (`lib/db.ts`) detecta automáticamente el destino:

- `*.neon.tech` → usa el driver HTTP de `@neondatabase/serverless` (recomendado
  para despliegues serverless).
- Cualquier otro Postgres (por ejemplo uno local en Docker) → usa el driver
  `pg` estándar.

Esto permite desarrollar contra un Postgres local y desplegar contra Neon sin
cambiar código.

## Estructura

```
sql/schema.sql              Esquema completo, idempotente, listo para Neon
scripts/setup-db.mjs        Aplica el esquema sin necesidad de psql
lib/db.ts                   Conexión (Neon HTTP o pg) + MissingTablesError
lib/data.ts                 Fetchers, normalización de tipos y datos de ejemplo
lib/types.ts                Tipos TypeScript alineados al esquema SQL
app/page.tsx                Dashboard principal (Overview + 3 módulos)
app/api/*/route.ts          Endpoints REST de solo lectura por módulo
components/layout/          Sidebar y barra superior tipo terminal
components/dashboard/       Los tres módulos core del panel
```

### Nota sobre tipos numéricos

PostgreSQL devuelve las columnas `NUMERIC` y `BIGINT` como *strings* para no
perder precisión. `lib/data.ts` los convierte a números antes de entregarlos a
la interfaz; sin esa conversión, operaciones como `cache_hit_rate.toFixed(1)`
fallarían y los promedios concatenarían texto en vez de sumar.

## Módulos

1. **Gestor de Entornos** — tabla `docker_environments` (imagen, puertos,
   volúmenes, estado) y `terminal_commands`, filtrable por sistema operativo
   (Windows 11 / macOS / Linux).
2. **Laboratorio de Rendimiento** — `stress_tests`: volumen de peticiones,
   concurrencia, distribución (`uniform`, `zipf`, ...) y resultados de hit
   rate de caché, con detalle opcional en `stress_test_samples`.
3. **Repositorio de Código** — `code_snippets` categorizados
   (`snippet_categories`), desde rutinas en Python hasta implementaciones en C
   con hilos POSIX (`uses_pthreads`).
