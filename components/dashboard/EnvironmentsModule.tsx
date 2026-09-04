"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge, osTone, statusTone } from "@/components/ui/Badge";
import type { DockerEnvironment, OsPlatform, TerminalCommand } from "@/lib/types";

function formatPorts(env: DockerEnvironment) {
  if (!env.ports.length) return "—";
  return env.ports.map((p) => `${p.host}:${p.container}/${p.protocol}`).join(", ");
}

function formatVolumes(env: DockerEnvironment) {
  if (!env.volumes.length) return "—";
  return env.volumes.map((v) => `${v.host} → ${v.container} (${v.mode})`).join("  ·  ");
}

const OS_TABS: { value: OsPlatform | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "windows11", label: "Windows 11" },
  { value: "macos", label: "macOS" },
  { value: "linux", label: "Linux" },
];

export function EnvironmentsModule({
  environments,
  commands,
}: {
  environments: DockerEnvironment[];
  commands: TerminalCommand[];
}) {
  const [osFilter, setOsFilter] = useState<OsPlatform | "all">("all");

  const filteredCommands = useMemo(
    () => (osFilter === "all" ? commands : commands.filter((c) => c.os_platform === osFilter)),
    [commands, osFilter]
  );

  return (
    <Panel
      id="entornos"
      title="Gestor de Entornos"
      subtitle="Contenedores Docker documentados y comandos de terminal por sistema operativo"
      accent="blue"
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Contenedores Docker */}
        <div className="xl:col-span-3">
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-carbon-400">
            docker_environments
          </h3>
          <div className="overflow-x-auto rounded-md border border-carbon-700">
            <table className="w-full min-w-[560px] border-collapse font-mono text-[12.5px]">
              <thead>
                <tr className="border-b border-carbon-700 bg-carbon-850 text-left text-carbon-400">
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Imagen</th>
                  <th className="px-3 py-2 font-medium">Puertos</th>
                  <th className="px-3 py-2 font-medium">Volúmenes</th>
                  <th className="px-3 py-2 font-medium">Host</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {environments.map((env, i) => (
                  <tr
                    key={env.id}
                    className={`border-b border-carbon-800 last:border-0 ${
                      i % 2 === 0 ? "bg-transparent" : "bg-carbon-900/40"
                    }`}
                  >
                    <td className="px-3 py-2 text-carbon-100">{env.name}</td>
                    <td className="px-3 py-2 text-neon-cyan">
                      {env.image}:{env.tag}
                    </td>
                    <td className="px-3 py-2 text-carbon-300">{formatPorts(env)}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-carbon-400" title={formatVolumes(env)}>
                      {formatVolumes(env)}
                    </td>
                    <td className="px-3 py-2">
                      {env.host_os ? (
                        <Badge tone={osTone(env.host_os)}>{env.host_os}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(env.status)}>{env.status}</Badge>
                    </td>
                  </tr>
                ))}
                {environments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-carbon-500">
                      Sin contenedores registrados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comandos de terminal */}
        <div className="xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-carbon-400">
              terminal_commands
            </h3>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {OS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setOsFilter(tab.value)}
                className={`rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                  osFilter === tab.value
                    ? "border-neon-blue/40 bg-neon-blue/10 text-neon-blue"
                    : "border-carbon-700 text-carbon-400 hover:border-carbon-500 hover:text-carbon-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredCommands.map((cmd) => (
              <div
                key={cmd.id}
                className="rounded-md border border-carbon-700 bg-carbon-850/60 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12.5px] text-carbon-100">{cmd.title}</span>
                  <div className="flex items-center gap-1.5">
                    {cmd.is_favorite ? <span className="text-neon-amber">★</span> : null}
                    <Badge tone={osTone(cmd.os_platform)}>{cmd.os_platform}</Badge>
                  </div>
                </div>
                <pre className="mt-1.5 overflow-x-auto rounded bg-carbon-950 px-2 py-1.5 font-mono text-[12px] text-neon-green">
                  <code>{cmd.command}</code>
                </pre>
                {cmd.description ? (
                  <p className="mt-1 font-mono text-[11px] text-carbon-500">{cmd.description}</p>
                ) : null}
              </div>
            ))}
            {filteredCommands.length === 0 ? (
              <p className="rounded-md border border-dashed border-carbon-700 px-3 py-6 text-center font-mono text-[12px] text-carbon-500">
                Sin comandos para este sistema operativo.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}
