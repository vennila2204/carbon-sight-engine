import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Database,
  Factory,
  Gauge,
  Leaf,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { INDUSTRIES } from "@/lib/industries";
import { t } from "@/lib/engine";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Carbon Intelligence Engine" },
      { name: "description", content: "Live factory emissions overview, intensity and reduction readiness." },
      { property: "og:title", content: "Carbon Intelligence Dashboard" },
      { property: "og:description", content: "Live factory emissions overview and reduction readiness." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ),
});

function Dashboard() {
  const { analysis, dataset, industry } = useApp();
  const profile = INDUSTRIES[industry];

  if (!analysis || !dataset) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No active dataset. Import a factory dataset to begin.
        </p>
        <Link to="/data" className="mt-4 inline-block">
          <Button>Go to Factory Data</Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={`${profile.label} decarbonisation overview`}
        subtitle={`${dataset.facility} · ${dataset.rows.length} reporting periods · dataset ${dataset.name}`}
        actions={
          <Link to="/optimize">
            <Button>
              Run optimisation <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total CO₂e"
          value={t(analysis.totalCO2e)}
          unit="tCO₂e"
          icon={Activity}
          tone="primary"
          delta={analysis.monthlyTrendPct}
          hint="vs first reporting period"
        />
        <KpiCard label="Scope 1 (direct)" value={t(analysis.scope1)} unit="tCO₂e" icon={Factory} />
        <KpiCard label="Scope 2 (purchased power)" value={t(analysis.scope2)} unit="tCO₂e" icon={Gauge} />
        <KpiCard
          label="Emission intensity"
          value={analysis.intensity.toFixed(3)}
          unit={`tCO₂e / ${profile.unit}`}
          icon={Leaf}
          tone={analysis.intensity > profile.benchmarkIntensity ? "warning" : "primary"}
          hint={`Benchmark ${profile.benchmarkIntensity} `}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Emissions trajectory</CardTitle>
            <CardDescription>Monthly Scope 1 + Scope 2 footprint (tCO₂e)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis.monthly} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#grad)"
                  name="Total tCO₂e"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {analysis.topSource && (
            <Card className="border-chart-3/40 bg-chart-3/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-chart-3" /> Highest emitting source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{analysis.topSource.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(analysis.topSource.co2e)} tCO₂e · {analysis.topSource.pct.toFixed(1)}% of the
                  total footprint
                </p>
                <Badge variant="secondary" className="mt-3">
                  Scope {analysis.topSource.scope}
                </Badge>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { to: "/data", label: "Import or replace dataset", icon: Database },
                { to: "/analysis", label: "Review source breakdown", icon: Activity },
                { to: "/simulator", label: "Test a what-if scenario", icon: Target },
              ].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 text-primary" />
                  {label}
                  <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
