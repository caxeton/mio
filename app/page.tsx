import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { EnvironmentsModule } from "@/components/dashboard/EnvironmentsModule";
import { PerformanceLabModule } from "@/components/dashboard/PerformanceLabModule";
import { CodeRepoModule } from "@/components/dashboard/CodeRepoModule";
import { SetupRequired } from "@/components/dashboard/SetupRequired";
import { getEnvironments, getCommands, getStressTests, getSnippets } from "@/lib/data";
import { hasDatabase, MissingTablesError } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let environments, commands, stressTests, snippets;

  try {
    [environments, commands, stressTests, snippets] = await Promise.all([
      getEnvironments(),
      getCommands(),
      getStressTests(),
      getSnippets(),
    ]);
  } catch (error) {
    if (error instanceof MissingTablesError) {
      return <SetupRequired relation={error.relation} />;
    }
    throw error;
  }

  const runningContainers = environments.filter((e) => e.status === "running").length;
  const totalRequests = stressTests.reduce((acc, t) => acc + t.request_volume, 0);
  const bestHitRate = stressTests.reduce(
    (max, t) => Math.max(max, t.cache_hit_rate ?? 0),
    0
  );

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-56">
        <TopBar dbConnected={hasDatabase} />

        <main className="grid-backdrop mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-6">
          <div id="overview">
            <div className="mb-4 flex items-baseline justify-between">
              <h1 className="font-mono text-lg font-semibold text-carbon-100">
                Panel de Control <span className="text-carbon-500">// Overview</span>
              </h1>
              <p className="hidden font-mono text-[11px] text-carbon-500 sm:block">
                Hub de Productividad para Desarrolladores
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Contenedores activos"
                value={runningContainers}
                suffix={`/ ${environments.length}`}
                accent="blue"
              />
              <StatCard
                label="Comandos registrados"
                value={commands.length}
                accent="green"
                trend={`${commands.filter((c) => c.os_platform === "windows11").length} win · ${
                  commands.filter((c) => c.os_platform === "macos").length
                } mac`}
              />
              <StatCard
                label="Peticiones simuladas"
                value={new Intl.NumberFormat("es-CL").format(totalRequests)}
                accent="amber"
                trend={`${stressTests.length} pruebas ejecutadas`}
              />
              <StatCard
                label="Mejor hit rate"
                value={bestHitRate.toFixed(1)}
                suffix="%"
                accent="pink"
                trend="distribución zipf"
              />
            </div>
          </div>

          <EnvironmentsModule environments={environments} commands={commands} />
          <PerformanceLabModule tests={stressTests} />
          <CodeRepoModule snippets={snippets} />

          <footer className="py-6 text-center font-mono text-[11px] text-carbon-600">
            devhub · esquema listo para Neon (PostgreSQL serverless) · sql/schema.sql
          </footer>
        </main>
      </div>
    </div>
  );
}
