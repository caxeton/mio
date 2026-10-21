import { describe, expect, it } from "vitest";
import { extractRelationName, isNeonUrl, isUndefinedTableError } from "@/lib/db";

describe("isNeonUrl", () => {
  it("detecta Neon por el hostname", () => {
    expect(isNeonUrl("postgres://u:p@ep-x-123.us-east-2.aws.neon.tech/db?sslmode=require")).toBe(
      true
    );
  });

  it("no se deja engañar por '.neon.tech' en la contraseña o la ruta", () => {
    expect(isNeonUrl("postgres://u:pass.neon.tech@localhost:5432/db")).toBe(false);
    expect(isNeonUrl("postgres://u:p@localhost:5432/x.neon.tech")).toBe(false);
  });

  it("tolera valores vacíos o inválidos", () => {
    expect(isNeonUrl(undefined)).toBe(false);
    expect(isNeonUrl("no es una url")).toBe(false);
  });
});

describe("detección de tablas faltantes", () => {
  it("reconoce el código 42P01", () => {
    expect(isUndefinedTableError({ code: "42P01" })).toBe(true);
  });

  it("reconoce el mensaje y extrae el nombre de la tabla", () => {
    const error = new Error('relation "stress_tests" does not exist');
    expect(isUndefinedTableError(error)).toBe(true);
    expect(extractRelationName(error)).toBe("stress_tests");
  });

  it("ignora otros errores", () => {
    expect(isUndefinedTableError(new Error("timeout"))).toBe(false);
    expect(isUndefinedTableError(null)).toBe(false);
  });
});
