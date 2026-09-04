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

2. Crear un proyecto en [Neon](https://console.neon.tech), copiar la cadena de
   conexión y ejecutar el esquema:

   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   ```

   (también se puede pegar el contenido de `sql/schema.sql` directamente en el
   SQL Editor de la consola de Neon).

3. Copiar `.env.example` a `.env` y completar `DATABASE_URL`:

   ```bash
   cp .env.example .env
   ```

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Estructura

```
sql/schema.sql            Esquema completo listo para ejecutar en Neon
lib/db.ts                 Cliente Neon (o null si no hay DATABASE_URL)
lib/data.ts                Fetchers + datos de ejemplo (fallback)
lib/types.ts               Tipos TypeScript alineados al esquema SQL
app/page.tsx                Dashboard principal (Overview + 3 módulos)
app/api/*/route.ts          Endpoints REST de solo lectura por módulo
components/layout/          Sidebar y barra superior tipo terminal
components/dashboard/       Los tres módulos core del panel
```

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
