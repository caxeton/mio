"use client";

import { useEffect, useState } from "react";

export function TopBar({ dbConnected }: { dbConnected: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-carbon-700 bg-carbon-950/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3 font-mono text-xs text-carbon-400">
        <span className="text-carbon-100">~/devhub</span>
        <span className="text-carbon-600">/</span>
        <span className="text-neon-blue">panel-control</span>
        <span className="ml-1 hidden animate-blink text-neon-green sm:inline">▌</span>
      </div>

      <div className="flex items-center gap-4 font-mono text-xs">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              dbConnected ? "bg-neon-green shadow-glow-green" : "bg-neon-amber"
            }`}
          />
          <span className={dbConnected ? "text-neon-green" : "text-neon-amber"}>
            {dbConnected ? "NEON::CONNECTED" : "NEON::MOCK_DATA"}
          </span>
        </div>
        <div className="text-carbon-400" suppressHydrationWarning>
          {now
            ? now.toLocaleTimeString("es-CL", { hour12: false })
            : "--:--:--"}
        </div>
      </div>
    </header>
  );
}
