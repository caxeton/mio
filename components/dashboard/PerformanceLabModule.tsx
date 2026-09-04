import { Panel } from "@/components/ui/Panel";
import { Badge, distributionTone } from "@/components/ui/Badge";
import type { StressTest } from "@/lib/types";

function formatNumber(n: number) {
  return new Intl.NumberFormat("es-CL").format(n);
}

function hitRateColor(rate: number) {
  if (rate >= 80) return "bg-neon-green";
  if (rate >= 50) return "bg-neon-amber";
  return "bg-neon-red";
}

export function PerformanceLabModule({ tests }: { tests: StressTest[] }) {
  const totalRequests = tests.reduce((acc, t) => acc + t.request_volume, 0);
  const avgHitRate =
    tests.length > 0
      ? tests.reduce((acc, t) => acc + (t.cache_hit_rate ?? 0), 0) / tests.length
      : 0;

  return (
    <Panel
      id="rendimiento"
      title="Laboratorio de Rendimiento"
      subtitle="Pruebas de estrés: volumen de peticiones y hit rate de caché por distribución"
      accent="green"
      toolbar={
        <div className="hidden gap-4 font-mono text-[11px] text-carbon-400 sm:flex">
          <span>
            peticiones totales:{" "}
            <span className="text-neon-blue">{formatNumber(totalRequests)}</span>
          </span>
          <span>
            hit rate prom.: <span className="text-neon-green">{avgHitRate.toFixed(1)}%</span>
          </span>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-md border border-carbon-700">
        <table className="w-full min-w-[820px] border-collapse font-mono text-[12.5px]">
          <thead>
            <tr className="border-b border-carbon-700 bg-carbon-850 text-left text-carbon-400">
              <th className="px-3 py-2 font-medium">Prueba</th>
              <th className="px-3 py-2 font-medium">Distribución</th>
              <th className="px-3 py-2 font-medium text-right">Peticiones</th>
              <th className="px-3 py-2 font-medium text-right">Concurrencia</th>
              <th className="px-3 py-2 font-medium text-right">Caché</th>
              <th className="px-3 py-2 font-medium text-right">p95 / p99</th>
              <th className="px-3 py-2 font-medium">Hit rate</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t, i) => (
              <tr
                key={t.id}
                className={`border-b border-carbon-800 last:border-0 ${
                  i % 2 === 0 ? "bg-transparent" : "bg-carbon-900/40"
                }`}
              >
                <td className="px-3 py-2 text-carbon-100">
                  {t.name}
                  {t.notes ? (
                    <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-carbon-500" title={t.notes}>
                      {t.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={distributionTone(t.distribution)}>
                    {t.distribution}
                    {t.zipf_exponent ? ` α=${t.zipf_exponent}` : ""}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right text-neon-cyan">
                  {formatNumber(t.request_volume)}
                </td>
                <td className="px-3 py-2 text-right text-carbon-300">{t.concurrency}</td>
                <td className="px-3 py-2 text-right text-carbon-300">
                  {t.cache_size ? formatNumber(t.cache_size) : "—"}
                </td>
                <td className="px-3 py-2 text-right text-carbon-300">
                  {t.p95_latency_ms ?? "—"} / {t.p99_latency_ms ?? "—"} ms
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-carbon-800">
                      <div
                        className={`h-full ${hitRateColor(t.cache_hit_rate ?? 0)}`}
                        style={{ width: `${Math.min(t.cache_hit_rate ?? 0, 100)}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-carbon-200">
                      {(t.cache_hit_rate ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {tests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-carbon-500">
                  Sin pruebas de estrés registradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
