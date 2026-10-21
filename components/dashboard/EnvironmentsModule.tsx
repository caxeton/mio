"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge, osTone, statusTone } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { FilterChip } from "@/components/ui/FilterChip";
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

const TH = "px-3 py-2 font-medium";

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

  const envNames = useMemo(
    () => new Map(environments.map((e) => [e.id, e.name])),
    [environments]
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
        <div className="min-w-0 xl:col-span-3">
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-carbon-400">
            docker_environments
          </h3>
          <div className="overflow-x-auto rounded-md border border-carbon-700">
            <table className="w-full min-w-[560px] border-collapse font-mono text-[12.5px]">
              <caption className="sr-only">Contenedores Docker documentados</caption>
              <thead>
                <tr className="border-b border-carbon-700 bg-carbon-850 text-left text-carbon-400">
                  <th scope="col" className={TH}>Nombre</th>
                  <th scope="col" className={TH}>Imagen</th>
                  <th scope="col" className={TH}>Puertos</th>
                  <th scope="col" className={TH}>Volúmenes</th>
                  <th scope="col" className={TH}>Host</th>
                  <th scope="col" className={TH}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {environments.map((env) => (
                  <tr
                    key={env.id}
                    className="border-b border-carbon-800 last:border-0 even:bg-carbon-900/40"
                  >
                    <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-normal text-carbon-100" title={env.description ?? undefined}>
                      {env.name}
                    </th>
                    <td className="whitespace-nowrap px-3 py-2 text-neon-cyan">
                      {env.image}:{env.tag}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-carbon-300">{formatPorts(env)}</td>
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
        <div className="min-w-0 xl:col-span-2">
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-carbon-400">
            terminal_commands
          </h3>
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por sistema operativo">
            {OS_TABS.map((tab) => (
              <FilterChip
                key={tab.value}
                active={osFilter === tab.value}
                onClick={() => setOsFilter(tab.value)}
                activeClassName="border-neon-blue/40 bg-neon-blue/10 text-neon-blue"
              >
                {tab.label}
              </FilterChip>
            ))}
          </div>

          <ul className="space-y-2">
            {filteredCommands.map((cmd) => {
              const envName = cmd.environment_id ? envNames.get(cmd.environment_id) : undefined;
              return (
                <li
                  key={cmd.id}
                  className="rounded-md border border-carbon-700 bg-carbon-850/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 font-mono text-[12.5px] text-carbon-100">{cmd.title}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {cmd.is_favorite ? (
                        <span className="text-neon-amber" title="Favorito" aria-label="Favorito">
                          ★
                        </span>
                      ) : null}
                      <Badge tone={osTone(cmd.os_platform)}>{cmd.os_platform}</Badge>
                      <CopyButton text={cmd.command} />
                    </div>
                  </div>
                  <pre className="mt-1.5 overflow-x-auto rounded bg-carbon-950 px-2 py-1.5 font-mono text-[12px] text-neon-green">
                    <code>{cmd.command}</code>
                  </pre>
                  {cmd.description || cmd.shell || envName ? (
                    <p className="mt-1 font-mono text-[11px] text-carbon-500">
                      {cmd.shell ? <span className="text-carbon-400">{cmd.shell}</span> : null}
                      {cmd.shell && (cmd.description || envName) ? " · " : null}
                      {cmd.description}
                      {envName ? (
                        <span className="text-carbon-400">
                          {cmd.description ? " · " : null}entorno: {envName}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </li>
              );
            })}
            {filteredCommands.length === 0 ? (
              <li className="rounded-md border border-dashed border-carbon-700 px-3 py-6 text-center font-mono text-[12px] text-carbon-500">
                Sin comandos para este sistema operativo.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
