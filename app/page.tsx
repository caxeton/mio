import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { EnvironmentsModule } from "@/components/dashboard/EnvironmentsModule";
import { PerformanceLabModule } from "@/components/dashboard/PerformanceLabModule";
import { CodeRepoModule } from "@/components/dashboard/CodeRepoModule";
import { SetupRequired } from "@/components/dashboard/SetupRequired";
import { getEnvironments, getCommands, getStressTests, getSnippets } from "@/lib/data";
import { dataSource, MissingTablesError } from "@/lib/db";
import { bestHitRateTest, countByOs, formatNumber, totalRequests } from "@/lib/stats";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const [environments, commands, stressTests, snippets] = await Promise.all([
    getEnvironments(),
    getCommands(),
    getStressTests(),
    getSnippets(),
  ]);
  return { environments, commands, stressTests, snippets };
}

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof loadDashboard>>;
  try {
    data = await loadDashboard();
  } catch (error) {
    if (error instanceof MissingTablesError) {
      return <SetupRequired relation={error.relation} />;
    }
    throw error;
  }

  const { environments, commands, stressTests, snippets } = data;
  const runningContainers = environments.filter((e) => e.status === "running").length;
  const byOs = countByOs(commands);
  const best = bestHitRateTest(stressTests);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-56">
        <TopBar dataSource={dataSource} />
        <MobileNav />

        <main className="grid-backdrop mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-6">
          <section id="overview" aria-labelledby="overview-title" className="scroll-mt-20">
            <div className="mb-4 flex items-baseline justify-between">
              <h1 id="overview-title" className="font-mono text-lg font-semibold text-carbon-100">
                Panel de Control <span className="text-carbon-500">{"// Overview"}</span>
              </h1>
              <p className="hidden font-mono text-[11px] text-carbon-500 sm:block">
                Hub de Productividad para Desarrolladores
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
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
                trend={`${byOs.windows11} win · ${byOs.macos} mac · ${byOs.linux} linux`}
              />
              <StatCard
                label="Peticiones simuladas"
                value={formatNumber(totalRequests(stressTests))}
                accent="amber"
                trend={`${stressTests.length} pruebas ejecutadas`}
              />
              <StatCard
                label="Mejor hit rate"
                value={best?.cache_hit_rate?.toFixed(1) ?? "—"}
                suffix={best ? "%" : undefined}
                accent="pink"
                trend={best ? `${best.name} · ${best.distribution}` : "sin pruebas con resultado"}
              />
            </div>
          </section>

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
