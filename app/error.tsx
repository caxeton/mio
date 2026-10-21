"use client";

import { useEffect } from "react";

/**
 * Pantalla de error del dashboard (p. ej. la base de datos no responde).
 * Evita la página genérica de Next.js y permite reintentar sin recargar.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        role="alert"
        className="w-full max-w-2xl rounded-lg border border-neon-red/30 bg-carbon-900/70 p-6"
      >
        <div className="mb-4 flex items-center gap-2.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-neon-red" />
          <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-neon-red">
            No se pudieron cargar los datos
          </h1>
        </div>
        <p className="font-mono text-[13px] leading-relaxed text-carbon-200">
          Ocurrió un error al consultar la base de datos. Revisa que la{" "}
          <span className="text-neon-blue">DATABASE_URL</span> sea correcta y que el servidor esté
          activo.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-carbon-500">ref: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded border border-neon-blue/40 bg-neon-blue/10 px-3 py-1.5 font-mono text-[12px] uppercase tracking-wide text-neon-blue hover:bg-neon-blue/20 focus-visible:outline focus-visible:outline-1 focus-visible:outline-neon-blue"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
