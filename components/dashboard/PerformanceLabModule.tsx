import { Panel } from "@/components/ui/Panel";
import { Badge, distributionTone } from "@/components/ui/Badge";
import { formatMs, formatNumber, totalRequests, weightedHitRate } from "@/lib/stats";
import type { StressTest } from "@/lib/types";

function hitRateColor(rate: number) {
  if (rate >= 80) return "bg-neon-green";
  if (rate >= 50) return "bg-neon-amber";
  return "bg-neon-red";
}

const TH = "px-3 py-2 font-medium";

export function PerformanceLabModule({ tests }: { tests: StressTest[] }) {
  const requests = totalRequests(tests);
  const avgHitRate = weightedHitRate(tests);

  return (
    <Panel
      id="rendimiento"
      title="Laboratorio de Rendimiento"
      subtitle="Pruebas de estrés: volumen de peticiones y hit rate de caché por distribución"
      accent="green"
      toolbar={
        <dl className="flex gap-4 font-mono text-[11px] text-carbon-400">
          <div className="flex gap-1">
            <dt>peticiones totales:</dt>
            <dd className="text-neon-blue">{formatNumber(requests)}</dd>
          </div>
          <div className="flex gap-1">
            <dt title="Promedio ponderado por volumen de peticiones">hit rate global:</dt>
            <dd className="text-neon-green">
              {avgHitRate === null ? "—" : `${avgHitRate.toFixed(1)}%`}
            </dd>
          </div>
        </dl>
      }
    >
      <div className="overflow-x-auto rounded-md border border-carbon-700">
        <table className="w-full min-w-[920px] border-collapse font-mono text-[12.5px]">
          <caption className="sr-only">Resultados de pruebas de estrés</caption>
          <thead>
            <tr className="border-b border-carbon-700 bg-carbon-850 text-left text-carbon-400">
              <th scope="col" className={TH}>Prueba</th>
              <th scope="col" className={TH}>Distribución</th>
              <th scope="col" className={`${TH} text-right`}>Peticiones</th>
              <th scope="col" className={`${TH} text-right`}>Concurrencia</th>
              <th scope="col" className={`${TH} text-right`}>Caché</th>
              <th scope="col" className={`${TH} text-right`}>Latencia prom.</th>
              <th scope="col" className={`${TH} text-right`}>p95 / p99</th>
              <th scope="col" className={`${TH} text-right`}>Errores</th>
              <th scope="col" className={TH}>Hit rate</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id} className="border-b border-carbon-800 last:border-0 even:bg-carbon-900/40">
                <th scope="row" className="px-3 py-2 text-left font-normal text-carbon-100">
                  {t.name}
                  {t.notes ? (
                    <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-carbon-500" title={t.notes}>
                      {t.notes}
                    </p>
                  ) : null}
                </th>
                <td className="px-3 py-2">
                  <Badge tone={distributionTone(t.distribution)}>
                    {t.distribution}
                    {t.zipf_exponent !== null ? ` α=${t.zipf_exponent}` : ""}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neon-cyan">
                  {formatNumber(t.request_volume)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-carbon-300">{t.concurrency}</td>
                <td className="px-3 py-2 text-right tabular-nums text-carbon-300">
                  {t.cache_size !== null ? formatNumber(t.cache_size) : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-carbon-300">
                  {formatMs(t.avg_latency_ms)} ms
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-carbon-300">
                  {formatMs(t.p95_latency_ms)} / {formatMs(t.p99_latency_ms)} ms
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    t.errors_count > 0 ? "text-neon-red" : "text-carbon-500"
                  }`}
                >
                  {formatNumber(t.errors_count)}
                </td>
                <td className="px-3 py-2">
                  {t.cache_hit_rate === null ? (
                    <span className="text-carbon-500">sin datos</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-24 overflow-hidden rounded-full bg-carbon-800"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={t.cache_hit_rate}
                        aria-label={`Hit rate de ${t.name}`}
                      >
                        <div
                          className={`h-full ${hitRateColor(t.cache_hit_rate)}`}
                          style={{ width: `${Math.min(Math.max(t.cache_hit_rate, 0), 100)}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-carbon-200">
                        {t.cache_hit_rate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {tests.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-carbon-500">
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
