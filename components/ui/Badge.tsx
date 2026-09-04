type BadgeTone = "blue" | "green" | "amber" | "pink" | "red" | "violet" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  blue: "border-neon-blue/30 bg-neon-blue/10 text-neon-blue",
  green: "border-neon-green/30 bg-neon-green/10 text-neon-green",
  amber: "border-neon-amber/30 bg-neon-amber/10 text-neon-amber",
  pink: "border-neon-pink/30 bg-neon-pink/10 text-neon-pink",
  red: "border-neon-red/30 bg-neon-red/10 text-neon-red",
  violet: "border-neon-violet/30 bg-neon-violet/10 text-neon-violet",
  neutral: "border-carbon-500 bg-carbon-800 text-carbon-200",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "running":
      return "green";
    case "stopped":
      return "neutral";
    case "restarting":
      return "amber";
    case "error":
      return "red";
    default:
      return "neutral";
  }
}

export function osTone(os: string): BadgeTone {
  switch (os) {
    case "windows11":
      return "blue";
    case "macos":
      return "violet";
    case "linux":
      return "amber";
    default:
      return "neutral";
  }
}

export function distributionTone(dist: string): BadgeTone {
  switch (dist) {
    case "zipf":
      return "pink";
    case "uniform":
      return "blue";
    case "normal":
      return "green";
    case "pareto":
      return "amber";
    default:
      return "neutral";
  }
}

export function languageTone(lang: string): BadgeTone {
  switch (lang) {
    case "c":
    case "cpp":
      return "blue";
    case "python":
      return "green";
    case "bash":
      return "amber";
    case "javascript":
    case "typescript":
      return "violet";
    case "sql":
      return "pink";
    default:
      return "neutral";
  }
}
