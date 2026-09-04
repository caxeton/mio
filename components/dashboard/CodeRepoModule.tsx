"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge, languageTone } from "@/components/ui/Badge";
import type { CodeSnippet } from "@/lib/types";

export function CodeRepoModule({ snippets }: { snippets: CodeSnippet[] }) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const set = new Map<string, string>();
    for (const s of snippets) {
      if (s.category_name) set.set(s.category_name, s.category_color ?? "#5a6270");
    }
    return Array.from(set.entries());
  }, [snippets]);

  const filtered = useMemo(() => {
    return snippets.filter((s) => {
      const matchesCategory = category === "all" || s.category_name === category;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        s.title.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.language.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [snippets, category, query]);

  return (
    <Panel
      id="snippets"
      title="Repositorio de Código"
      subtitle="Snippets categorizados — desde rutinas en Python hasta hilos POSIX en C"
      accent="pink"
      toolbar={
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="buscar por título, tag o lenguaje…"
          className="w-56 rounded border border-carbon-700 bg-carbon-950 px-2.5 py-1.5 font-mono text-[12px] text-carbon-100 placeholder:text-carbon-600 focus:border-neon-pink/50 focus:outline-none"
        />
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategory("all")}
          className={`rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors ${
            category === "all"
              ? "border-neon-pink/40 bg-neon-pink/10 text-neon-pink"
              : "border-carbon-700 text-carbon-400 hover:border-carbon-500 hover:text-carbon-200"
          }`}
        >
          Todas
        </button>
        {categories.map(([name, color]) => (
          <button
            key={name}
            onClick={() => setCategory(name)}
            style={
              category === name
                ? { borderColor: `${color}66`, backgroundColor: `${color}1a`, color }
                : undefined
            }
            className={`rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors ${
              category === name
                ? ""
                : "border-carbon-700 text-carbon-400 hover:border-carbon-500 hover:text-carbon-200"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((s) => (
          <article
            key={s.id}
            className="flex flex-col rounded-md border border-carbon-700 bg-carbon-850/50"
          >
            <div className="flex items-center justify-between gap-2 border-b border-carbon-700 px-3 py-2">
              <div className="min-w-0">
                <h3 className="truncate font-mono text-[13px] text-carbon-100">{s.title}</h3>
                {s.category_name ? (
                  <span
                    className="font-mono text-[10.5px]"
                    style={{ color: s.category_color ?? "#7c8494" }}
                  >
                    {s.category_name}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {s.uses_pthreads ? <Badge tone="amber">pthreads</Badge> : null}
                <Badge tone={languageTone(s.language)}>{s.language}</Badge>
              </div>
            </div>

            <pre className="max-h-56 overflow-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed text-neon-green">
              <code>{s.code}</code>
            </pre>

            <div className="mt-auto border-t border-carbon-700 px-3 py-2">
              {s.description ? (
                <p className="font-mono text-[11px] text-carbon-400">{s.description}</p>
              ) : null}
              {s.complexity_notes ? (
                <p className="mt-1 font-mono text-[11px] text-carbon-500">
                  <span className="text-carbon-400">notas:</span> {s.complexity_notes}
                </p>
              ) : null}
              {s.tags.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-carbon-800 px-1.5 py-0.5 font-mono text-[10px] text-carbon-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-full rounded-md border border-dashed border-carbon-700 px-3 py-8 text-center font-mono text-[12px] text-carbon-500">
            Sin snippets que coincidan con el filtro.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
