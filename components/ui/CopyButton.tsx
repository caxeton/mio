"use client";

import { useEffect, useState } from "react";

/** Botón para copiar un comando o snippet al portapapeles. */
export function CopyButton({ text, label = "copiar" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const id = setTimeout(() => setState("idle"), 1500);
    return () => clearTimeout(id);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // El portapapeles no está disponible fuera de contextos seguros (http sin localhost).
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${label} al portapapeles`}
      className="rounded border border-carbon-700 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-carbon-400 transition-colors hover:border-carbon-500 hover:text-carbon-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-neon-blue"
    >
      <span aria-live="polite">
        {state === "copied" ? "copiado ✓" : state === "error" ? "sin acceso" : label}
      </span>
    </button>
  );
}
