import { describe, expect, it } from "vitest";
import { GET as getCommands } from "@/app/api/commands/route";
import { GET as getSnippets } from "@/app/api/snippets/route";
import { GET as getHealth } from "@/app/api/health/route";

const req = (path: string) => new Request(`http://localhost${path}`);

describe("GET /api/commands", () => {
  it("filtra por sistema operativo", async () => {
    const res = await getCommands(req("/api/commands?os=linux"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((c: { os_platform: string }) => c.os_platform === "linux")).toBe(true);
  });

  it("rechaza un sistema operativo inválido con 400", async () => {
    const res = await getCommands(req("/api/commands?os=solaris"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.allowed).toContain("linux");
  });
});

describe("GET /api/snippets", () => {
  it("filtra por lenguaje", async () => {
    const res = await getSnippets(req("/api/snippets?language=c"));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].uses_pthreads).toBe(true);
  });

  it("rechaza un lenguaje inválido con 400", async () => {
    const res = await getSnippets(req("/api/snippets?language=cobol"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/health", () => {
  it("informa el origen de datos", async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", dataSource: "mock" });
  });
});

describe("orden de los datos de ejemplo", () => {
  it("coincide con el ORDER BY de SQL (favoritos primero, luego más recientes)", async () => {
    const res = await getCommands(req("/api/commands"));
    const { data } = await res.json();
    const favs = data.map((c: { is_favorite: boolean }) => c.is_favorite);
    expect(favs).toEqual([...favs].sort((a, b) => Number(b) - Number(a)));
    expect(data[0].id).toBe("cmd-2");
  });
});
