import type { ReactNode } from "react";

const ACCENT_COLOR = {
  blue: "bg-neon-blue",
  green: "bg-neon-green",
  amber: "bg-neon-amber",
  pink: "bg-neon-pink",
} as const;

export function Panel({
  id,
  title,
  subtitle,
  accent = "blue",
  toolbar,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  accent?: keyof typeof ACCENT_COLOR;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 rounded-lg border border-carbon-700 bg-carbon-900/60 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-carbon-700 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className={`h-2 w-2 rounded-full ${ACCENT_COLOR[accent]} shadow-glow`} />
          <div>
            <h2
              id={headingId}
              className="font-mono text-sm font-semibold uppercase tracking-wider text-carbon-100"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 font-mono text-[11px] text-carbon-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
