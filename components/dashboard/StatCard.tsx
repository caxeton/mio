const ACCENT_TEXT = {
  blue: "text-neon-blue",
  green: "text-neon-green",
  amber: "text-neon-amber",
  pink: "text-neon-pink",
} as const;

export function StatCard({
  label,
  value,
  suffix,
  accent = "blue",
  trend,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: keyof typeof ACCENT_TEXT;
  trend?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-carbon-700 bg-carbon-900/60 px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-wider text-carbon-400">{label}</p>
      <p className={`mt-1.5 truncate font-mono text-2xl font-semibold ${ACCENT_TEXT[accent]}`}>
        {value}
        {suffix ? <span className="ml-1 text-sm text-carbon-400">{suffix}</span> : null}
      </p>
      {trend ? <p className="mt-1 truncate font-mono text-[11px] text-carbon-500">{trend}</p> : null}
    </div>
  );
}
