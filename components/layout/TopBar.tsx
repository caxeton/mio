"use client";

import { useSyncExternalStore } from "react";
import type { DataSource } from "@/lib/types";

const SOURCE_LABEL: Record<DataSource, string> = {
  neon: "NEON::CONNECTED",
  postgres: "POSTGRES::CONNECTED",
  mock: "MOCK_DATA",
};

// Reloj como "store externo": evita setState dentro de useEffect y el
// desajuste de hidratación (en el servidor se muestra --:--:--).
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const getSecond = () => Math.floor(Date.now() / 1000);
const getServerSecond = () => null;

const timeFormatter = new Intl.DateTimeFormat("es-CL", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function TopBar({ dataSource }: { dataSource: DataSource }) {
  const second = useSyncExternalStore(subscribe, getSecond, getServerSecond);
  const live = dataSource !== "mock";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-carbon-700 bg-carbon-950/90 px-4 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-3 font-mono text-xs text-carbon-400">
        <span className="text-carbon-100">~/devhub</span>
        <span className="text-carbon-600">/</span>
        <span className="truncate text-neon-blue">panel-control</span>
        <span aria-hidden className="ml-1 hidden animate-blink text-neon-green sm:inline">
          ▌
        </span>
      </div>

      <div className="flex items-center gap-4 font-mono text-xs">
        <div className="flex items-center gap-1.5" title={`Origen de datos: ${dataSource}`}>
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "bg-neon-green shadow-glow-green" : "bg-neon-amber"
            }`}
          />
          <span className={`hidden sm:inline ${live ? "text-neon-green" : "text-neon-amber"}`}>
            {SOURCE_LABEL[dataSource]}
          </span>
        </div>
        <time className="tabular-nums text-carbon-400">
          {second === null ? "--:--:--" : timeFormatter.format(second * 1000)}
        </time>
      </div>
    </header>
  );
}
