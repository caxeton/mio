import type { StressTest, TerminalCommand, OsPlatform } from "./types";

// Cálculos puros del dashboard, separados de los componentes para poder
// probarlos sin renderizar React.

export function totalRequests(tests: StressTest[]): number {
  return tests.reduce((acc, t) => acc + t.request_volume, 0);
}

/**
 * Hit rate global ponderado por volumen de peticiones.
 *
 * Un promedio simple de los porcentajes da el mismo peso a una prueba de
 * 1.000 peticiones que a una de 1.000.000, y además contaba como 0% las
 * pruebas sin resultado (cache_hit_rate = null). Aquí se ignoran esas pruebas
 * y cada una pesa según su request_volume. Devuelve null si no hay datos.
 */
export function weightedHitRate(tests: StressTest[]): number | null {
  let weighted = 0;
  let volume = 0;
  for (const t of tests) {
    if (t.cache_hit_rate === null || t.request_volume <= 0) continue;
    weighted += t.cache_hit_rate * t.request_volume;
    volume += t.request_volume;
  }
  return volume > 0 ? weighted / volume : null;
}

/** Prueba con mayor hit rate (ignora las que no tienen resultado). */
export function bestHitRateTest(tests: StressTest[]): StressTest | null {
  let best: StressTest | null = null;
  for (const t of tests) {
    if (t.cache_hit_rate === null) continue;
    if (!best || t.cache_hit_rate > (best.cache_hit_rate ?? -1)) best = t;
  }
  return best;
}

export function countByOs(commands: TerminalCommand[]): Record<OsPlatform, number> {
  const counts: Record<OsPlatform, number> = { windows11: 0, macos: 0, linux: 0 };
  for (const c of commands) counts[c.os_platform] = (counts[c.os_platform] ?? 0) + 1;
  return counts;
}

const numberFormatter = new Intl.NumberFormat("es-CL");
const decimalFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });

export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}

/** Formatea milisegundos con un decimal como máximo; "—" si no hay dato. */
export function formatMs(n: number | null): string {
  return n === null ? "—" : decimalFormatter.format(n);
}
