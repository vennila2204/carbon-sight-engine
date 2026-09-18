import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Factory, Gauge, Leaf, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { INDUSTRIES } from "@/lib/industries";
import { t } from "@/lib/engine";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Carbon Analysis — Carbon Intelligence Engine" },
      { name: "description", content: "Scope 1 and Scope 2 breakdown, intensity and source-level emissions analysis." },
      { property: "og:title", content: "Carbon Analysis" },
      { property: "og:description", content: "Scope 1 and Scope 2 breakdown, intensity and source-level emissions." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Analysis />
    </AppLayout>
  ),
});

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function Analysis() {
  const { analysis, dataset, industry } = useApp();
  const profile = INDUSTRIES[industry];

  if (!analysis || !dataset) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Import a dataset to run the carbon analysis.</p>
        <Link to="/data" className="mt-4 inline-block">
          <Button>Go to Factory Data</Button>
        </Link>
      </Card>
    );
  }

  const scopeData = [
    { name: "Scope 1 — direct", value: +analysis.scope1.toFixed(1) },
    { name: "Scope 2 — purchased electricity", value: +analysis.scope2.toFixed(1) },
  ];

  return (
    <>
      <PageHeader
        title="Carbon analysis"
        subtitle={`Calculated from ${dataset.name} using ${profile.label} emission factors.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total CO₂e" value={t(analysis.totalCO2e)} unit="t" icon={Activity} tone="primary" />
        <KpiCard label="Scope 1" value={t(analysis.scope1)} unit="t" icon={Factory} />
        <KpiCard label="Scope 2" value={t(analysis.scope2)} unit="t" icon={Gauge} />
        <KpiCard
          label="Intensity"
          value={analysis.intensity.toFixed(3)}
          unit={`t / ${profile.unit}`}
          icon={Leaf}
        />
        <KpiCard
          label="Monthly trend"
          value={`${analysis.monthlyTrendPct > 0 ? "+" : ""}${analysis.monthlyTrendPct.toFixed(1)}%`}
          icon={analysis.monthlyTrendPct > 0 ? TrendingUp : TrendingDown}
          tone={analysis.monthlyTrendPct > 0 ? "warning" : "primary"}
          hint="last vs first period"
        />
      </div>

      {analysis.topSource && (
        <Card className="mt-6 border-chart-4/40 bg-chart-4/5">
          <CardContent className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-chart-4" />
              <div>
                <p className="font-semibold">
                  {analysis.topSource.label} is your largest emission source
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(analysis.topSource.co2e)} tCO₂e — {analysis.topSource.pct.toFixed(1)}% of total.
                  Target this first for the biggest abatement per rupee.
                </p>
              </div>
            </div>
            <Link to="/optimize">
              <Button variant="outline">Optimise this source</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Emissions by source</CardTitle>
            <CardDescription>tCO₂e per emission source across the reporting window</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.sources} margin={{ left: -14, right: 8, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-18} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)} tCO₂e`} />
                <Bar dataKey="co2e" radius={[6, 6, 0, 0]} name="tCO₂e">
                  {analysis.sources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scope 1 vs Scope 2 & source contribution</CardTitle>
            <CardDescription>Inner ring: scopes · outer ring: individual sources</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={scopeData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                  {scopeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Pie
                  data={analysis.sources}
                  dataKey="co2e"
                  nameKey="label"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={2}
                >
                  {analysis.sources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.75} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toFixed(1)} tCO₂e`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly emissions trend</CardTitle>
          <CardDescription>Scope split across each reporting period</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analysis.monthly} margin={{ left: -14, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="scope1" stroke="var(--color-chart-1)" strokeWidth={2} name="Scope 1" />
              <Line type="monotone" dataKey="scope2" stroke="var(--color-chart-2)" strokeWidth={2} name="Scope 2" />
              <Line type="monotone" dataKey="total" stroke="var(--color-chart-4)" strokeWidth={2} strokeDasharray="4 3" name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detailed source breakdown</CardTitle>
          <CardDescription>Emission factors applied to mapped dataset columns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Consumption</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Emission factor</TableHead>
                  <TableHead className="text-right">CO₂e (t)</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.sources.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.label}
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Scope {s.scope}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{Math.round(s.consumption).toLocaleString("en-IN")}</TableCell>
                    <TableCell>{s.unit}</TableCell>
                    <TableCell className="text-right">{s.factor}</TableCell>
                    <TableCell className="text-right font-semibold">{s.co2e.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{s.pct.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      <span className={s.trend > 0 ? "text-destructive" : "text-primary"}>
                        {s.trend > 0 ? "+" : ""}
                        {s.trend.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
