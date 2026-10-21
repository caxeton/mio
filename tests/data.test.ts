import { describe, expect, it } from "vitest";
import { normalizeSnippet, normalizeStressTest, toIsoString, toNumber } from "@/lib/data";

describe("toNumber", () => {
  it("convierte strings numéricos (NUMERIC/BIGINT de Postgres)", () => {
    expect(toNumber("87.34")).toBe(87.34);
    expect(toNumber("9007199254740991")).toBe(9007199254740991);
  });

  it("devuelve null para valores vacíos o inválidos", () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber("")).toBeNull();
    expect(toNumber("   ")).toBeNull();
    expect(toNumber("abc")).toBeNull();
    expect(toNumber(Infinity)).toBeNull();
  });
});

describe("toIsoString", () => {
  it("convierte Date a ISO", () => {
    expect(toIsoString(new Date("2026-09-01T16:00:00Z"))).toBe("2026-09-01T16:00:00.000Z");
  });
});

describe("normalizeStressTest", () => {
  it("convierte las columnas numéricas que llegan como string", () => {
    const t = normalizeStressTest({
      id: "x",
      name: "bench",
      request_volume: 10000,
      concurrency: 50,
      distribution: "zipf",
      zipf_exponent: "1.200",
      cache_size: 500,
      duration_ms: 39500,
      avg_latency_ms: "3.114",
      p95_latency_ms: "9.200",
      p99_latency_ms: "15.700",
      cache_hits: "8734",
      cache_misses: "1266",
      cache_hit_rate: "87.34",
      errors_count: 0,
      executed_at: new Date("2026-09-02T10:30:00Z"),
      created_at: new Date("2026-09-02T10:30:00Z"),
    });
    expect(t.cache_hit_rate).toBe(87.34);
    expect(t.cache_hits + t.cache_misses).toBe(10000);
    expect(t.zipf_exponent).toBe(1.2);
    expect(t.executed_at).toBe("2026-09-02T10:30:00.000Z");
  });

  it("mantiene null en los campos opcionales sin dato", () => {
    const t = normalizeStressTest({ request_volume: "5", cache_hit_rate: null });
    expect(t.cache_hit_rate).toBeNull();
    expect(t.errors_count).toBe(0);
  });
});

describe("normalizeSnippet", () => {
  it("normaliza un snippet sin categoría (LEFT JOIN con nulls)", () => {
    const s = normalizeSnippet({
      id: "s",
      category_id: null,
      category_name: null,
      category_color: null,
      tags: null,
      uses_pthreads: false,
    });
    expect(s.category_id).toBeNull();
    expect(s.category_name).toBeNull();
    expect(s.tags).toEqual([]);
  });
});
