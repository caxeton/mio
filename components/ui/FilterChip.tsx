import type { CSSProperties, ReactNode } from "react";

const BASE =
  "rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-neon-blue";
const INACTIVE = "border-carbon-700 text-carbon-400 hover:border-carbon-500 hover:text-carbon-200";

/**
 * Botón de filtro tipo "chip". Expone su estado con aria-pressed para que los
 * lectores de pantalla sepan cuál está seleccionado.
 */
export function FilterChip({
  active,
  onClick,
  activeClassName = "",
  activeStyle,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeClassName?: string;
  activeStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={active ? activeStyle : undefined}
      className={`${BASE} ${active ? activeClassName : INACTIVE}`}
    >
      {children}
    </button>
  );
}
