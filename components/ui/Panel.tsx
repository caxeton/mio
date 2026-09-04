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
  accent?: "blue" | "green" | "amber" | "pink";
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const accentColor = {
    blue: "bg-neon-blue",
    green: "bg-neon-green",
    amber: "bg-neon-amber",
    pink: "bg-neon-pink",
  }[accent];

  return (
    <section
      id={id}
      className="scroll-mt-20 rounded-lg border border-carbon-700 bg-carbon-900/60 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]"
    >
      <header className="flex items-center justify-between gap-4 border-b border-carbon-700 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${accentColor} shadow-glow`} />
          <div>
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-carbon-100">
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
