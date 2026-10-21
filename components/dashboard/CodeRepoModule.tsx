"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge, languageTone } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { FilterChip } from "@/components/ui/FilterChip";
import type { CodeSnippet } from "@/lib/types";

const ALL = "all";
const FALLBACK_COLOR = "#7c8494";

export function CodeRepoModule({ snippets }: { snippets: CodeSnippet[] }) {
  const [category, setCategory] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  // Mantiene el input fluido aunque haya muchos snippets que filtrar.
  const deferredSearch = useDeferredValue(search);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of snippets) {
      if (s.category_name) map.set(s.category_name, s.category_color ?? FALLBACK_COLOR);
    }
    return Array.from(map.entries());
  }, [snippets]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return snippets.filter((s) => {
      if (category !== ALL && s.category_name !== category) return false;
      if (q.length === 0) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [snippets, category, deferredSearch]);

  return (
    <Panel
      id="snippets"
      title="Repositorio de Código"
      subtitle="Snippets categorizados — desde rutinas en Python hasta hilos POSIX en C"
      accent="pink"
      toolbar={
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="buscar por título, tag o lenguaje…"
          aria-label="Buscar snippets por título, descripción, tag o lenguaje"
          className="w-full min-w-0 rounded border border-carbon-700 bg-carbon-950 px-2.5 py-1.5 font-mono text-[12px] text-carbon-100 placeholder:text-carbon-600 focus:border-neon-pink/50 focus:outline-none sm:w-56"
        />
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoría">
        <FilterChip
          active={category === ALL}
          onClick={() => setCategory(ALL)}
          activeClassName="border-neon-pink/40 bg-neon-pink/10 text-neon-pink"
        >
          Todas
        </FilterChip>
        {categories.map(([name, color]) => (
          <FilterChip
            key={name}
            active={category === name}
            onClick={() => setCategory(name)}
            activeStyle={{ borderColor: `${color}66`, backgroundColor: `${color}1a`, color }}
          >
            {name}
          </FilterChip>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered.length} snippets visibles
      </p>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((s) => (
          <article
            key={s.id}
            className="flex min-w-0 flex-col rounded-md border border-carbon-700 bg-carbon-850/50"
          >
            <div className="flex items-center justify-between gap-2 border-b border-carbon-700 px-3 py-2">
              <div className="min-w-0">
                <h3 className="truncate font-mono text-[13px] text-carbon-100" title={s.title}>
                  {s.title}
                </h3>
                {s.category_name ? (
                  <span
                    className="font-mono text-[10.5px]"
                    style={{ color: s.category_color ?? FALLBACK_COLOR }}
                  >
                    {s.category_name}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {s.uses_pthreads ? <Badge tone="amber">pthreads</Badge> : null}
                <Badge tone={languageTone(s.language)}>{s.language}</Badge>
                <CopyButton text={s.code} />
              </div>
            </div>

            <pre
              tabIndex={0}
              aria-label={`Código de ${s.title}`}
              className="max-h-56 overflow-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed text-neon-green focus-visible:outline focus-visible:outline-1 focus-visible:outline-neon-pink/50"
            >
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
                <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="Tags">
                  {s.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded bg-carbon-800 px-1.5 py-0.5 font-mono text-[10px] text-carbon-400"
                    >
                      #{t}
                    </li>
                  ))}
                </ul>
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
