import pkg from "@/package.json";
import { NAV_ITEMS } from "./nav";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-carbon-700 bg-carbon-950/95 lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-carbon-700 px-4">
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded bg-neon-green/10 font-mono text-xs font-bold text-neon-green shadow-glow-green"
        >
          &gt;_
        </span>
        <span className="font-mono text-sm font-semibold tracking-tight text-carbon-100">
          dev<span className="text-neon-green">hub</span>
        </span>
      </div>

      <nav aria-label="Módulos" className="flex-1 space-y-0.5 px-2 py-4">
        <p className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-widest text-carbon-500">
          Módulos
        </p>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-md px-2.5 py-2 font-mono text-[13px] text-carbon-300 transition-colors hover:bg-carbon-800 hover:text-neon-blue focus-visible:bg-carbon-800 focus-visible:text-neon-blue focus-visible:outline-none"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden className="text-carbon-600 group-hover:text-neon-blue">
                $
              </span>
              {item.label}
            </span>
            <span className="text-[10px] text-carbon-600 group-hover:text-carbon-400">
              {item.hint}
            </span>
          </a>
        ))}
      </nav>

      <div className="border-t border-carbon-700 px-4 py-3">
        <p className="font-mono text-[10px] leading-relaxed text-carbon-500">
          v{pkg.version} · Next.js + Neon
          <br />
          build: {process.env.NODE_ENV}
        </p>
      </div>
    </aside>
  );
}
