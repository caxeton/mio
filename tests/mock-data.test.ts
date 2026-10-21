import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MOCK_COMMANDS,
  MOCK_ENVIRONMENTS,
  MOCK_SNIPPETS,
  MOCK_STRESS_TESTS,
} from "@/lib/mock-data";

// Los datos de ejemplo deben reflejar el seed de sql/schema.sql: si alguien
// cambia uno y no el otro, la app muestra cosas distintas con y sin base de datos.
const schema = readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8");

/** Escapa un texto como literal E'...' de PostgreSQL. */
const pgEscapeString = (s: string) =>
  "E'" + s.replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\n/g, "\\n") + "'";

/** Escapa un texto como literal '...' estándar de PostgreSQL. */
const pgString = (s: string) => `'${s.replace(/'/g, "''")}'`;

describe("mock-data ↔ sql/schema.sql", () => {
  it.each(MOCK_ENVIRONMENTS.map((e) => [e.name]))("el entorno %s está en el seed", (name) => {
    expect(schema).toContain(pgString(name));
  });

  it.each(MOCK_COMMANDS.map((c) => [c.title, c]))("el comando «%s» está en el seed", (_, c) => {
    expect(schema).toContain(`${pgString(c.title)}, ${pgString(c.command)}, '${c.os_platform}'`);
  });

  it.each(MOCK_STRESS_TESTS.map((t) => [t.name]))("la prueba «%s» está en el seed", (name) => {
    expect(schema).toContain(pgString(name));
  });

  it.each(MOCK_SNIPPETS.map((s) => [s.title, s]))(
    "el código del snippet «%s» es idéntico en el seed",
    (_, s) => {
      expect(schema).toContain(pgEscapeString(s.code));
    }
  );

  it("los contadores de caché son coherentes con el volumen de peticiones", () => {
    for (const t of MOCK_STRESS_TESTS) {
      expect(t.cache_hits + t.cache_misses).toBe(t.request_volume);
      expect(t.cache_hit_rate).toBeCloseTo((t.cache_hits / t.request_volume) * 100, 2);
    }
  });
});
