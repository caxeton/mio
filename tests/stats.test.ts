import { describe, expect, it } from "vitest";
import { bestHitRateTest, countByOs, totalRequests, weightedHitRate } from "@/lib/stats";
import { MOCK_COMMANDS, MOCK_STRESS_TESTS } from "@/lib/mock-data";
import type { StressTest } from "@/lib/types";

const test = (over: Partial<StressTest>): StressTest => ({ ...MOCK_STRESS_TESTS[0], ...over });

describe("weightedHitRate", () => {
  it("pondera por volumen de peticiones", () => {
    const tests = [
      test({ request_volume: 1000, cache_hit_rate: 10 }),
      test({ request_volume: 9000, cache_hit_rate: 90 }),
    ];
    expect(weightedHitRate(tests)).toBeCloseTo(82);
  });

  it("ignora pruebas sin resultado en vez de contarlas como 0%", () => {
    const tests = [test({ cache_hit_rate: 80 }), test({ cache_hit_rate: null })];
    expect(weightedHitRate(tests)).toBe(80);
  });

  it("devuelve null si no hay datos", () => {
    expect(weightedHitRate([])).toBeNull();
    expect(weightedHitRate([test({ cache_hit_rate: null })])).toBeNull();
  });
});

describe("bestHitRateTest", () => {
  it("devuelve la prueba con mayor hit rate", () => {
    expect(bestHitRateTest(MOCK_STRESS_TESTS)?.id).toBe("test-3");
  });

  it("devuelve null si ninguna prueba tiene resultado", () => {
    expect(bestHitRateTest([test({ cache_hit_rate: null })])).toBeNull();
  });
});

describe("agregados", () => {
  it("suma el volumen total de peticiones", () => {
    expect(totalRequests(MOCK_STRESS_TESTS)).toBe(45000);
  });

  it("cuenta comandos por sistema operativo, incluido Linux", () => {
    expect(countByOs(MOCK_COMMANDS)).toEqual({ windows11: 2, macos: 2, linux: 2 });
  });
});
