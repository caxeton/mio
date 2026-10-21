export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <p className="font-mono text-xs text-carbon-400">
        <span className="text-neon-green">$</span> cargando panel
        <span aria-hidden className="ml-1 animate-blink text-neon-green">
          ▌
        </span>
      </p>
    </div>
  );
}
