/**
 * Pantalla que se muestra cuando hay conexión a la base de datos pero el
 * esquema todavía no se aplicó. Explica exactamente qué hacer, en vez de
 * dejar que Next.js muestre un stack trace.
 */
export function SetupRequired({ relation }: { relation?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-lg border border-neon-amber/30 bg-carbon-900/70 p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-neon-amber" />
          <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-neon-amber">
            Falta aplicar el esquema
          </h1>
        </div>

        <p className="font-mono text-[13px] leading-relaxed text-carbon-200">
          La conexión a la base de datos funciona, pero{" "}
          {relation ? (
            <>
              la tabla <span className="text-neon-blue">{relation}</span> no existe todavía.
            </>
          ) : (
            <>las tablas del esquema no existen todavía.</>
          )}
        </p>

        <p className="mt-4 font-mono text-[12px] text-carbon-400">
          Ejecuta esto en la terminal, en la raíz del proyecto:
        </p>
        <pre className="mt-2 overflow-x-auto rounded border border-carbon-700 bg-carbon-950 px-3 py-2.5 font-mono text-[13px] text-neon-green">
          <code>npm run db:setup</code>
        </pre>

        <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-carbon-500">
          Ese comando aplica <span className="text-carbon-300">sql/schema.sql</span> sobre la
          base de datos de tu <span className="text-carbon-300">DATABASE_URL</span>. Es seguro
          ejecutarlo varias veces: crea lo que falte y no duplica datos.
          <br />
          Después recarga esta página.
        </p>
      </div>
    </div>
  );
}
