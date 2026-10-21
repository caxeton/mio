import { NAV_ITEMS } from "./nav";

/** Navegación para pantallas pequeñas, donde la Sidebar está oculta. */
export function MobileNav() {
  return (
    <nav
      aria-label="Módulos"
      className="flex gap-1 overflow-x-auto border-b border-carbon-700 bg-carbon-950/90 px-4 py-2 lg:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="shrink-0 rounded-md px-2.5 py-1 font-mono text-[12px] text-carbon-300 transition-colors hover:bg-carbon-800 hover:text-neon-blue focus-visible:bg-carbon-800 focus-visible:text-neon-blue focus-visible:outline-none"
        >
          <span aria-hidden className="text-carbon-600">$ </span>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
