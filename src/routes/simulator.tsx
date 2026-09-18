import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/context/AppContext";
import { evaluateActions, inr, optimise, t } from "@/lib/engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — Carbon Intelligence Engine" },
      { name: "description", content: "Move budget, tariff, production and renewable sliders and see the plan recalculate live." },
      { property: "og:title", content: "What-If Decarbonisation Simulator" },
      { property: "og:description", content: "Real-time scenario recalculation against your current reduction plan." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Simulator />
    </AppLayout>
  ),
});

const BASE = {
  budget: 90,
  production: 100,
  tariff: 8.5,
  fuel: 92,
  renewable: 10,
  target: 25,
};

function Simulator() {
  const { analysis } = useApp();
  const [s, setS] = useState(BASE);

  const { current, scenario } = useMemo(() => {
    if (!analysis) return { current: null, scenario: null };
    const basePool = evaluateActions(analysis, undefined, { renewablePct: BASE.renewable, productionScale: 1 });
    const scenarioPool = evaluateActions(analysis, undefined, {
      renewablePct: s.renewable,
      productionScale: s.production / 100,
    });
    return {
      current: optimise(analysis, { targetPct: BASE.target, budgetInr: BASE.budget * 1e7, maxTimelineMonths: 18, allowProductionImpact: true }, basePool),
      scenario: optimise(analysis, { targetPct: s.target, budgetInr: s.budget * 1e7, maxTimelineMonths: 18, allowProductionImpact: true }, scenarioPool),
    };
  }, [analysis, s]);

  if (!analysis || !current || !scenario) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Import a dataset to simulate scenarios.</p>
        <Link to="/data" className="mt-4 inline-block">
          <Button>Go to Factory Data</Button>
        </Link>
      </Card>
    );
  }

  const opexCurrent =
    analysis.sources.find((x) => x.id === "electricity")!.consumption * BASE.tariff +
    analysis.sources.find((x) => x.id === "fuel")!.consumption * BASE.fuel;
  const opexScenario =
    analysis.sources.find((x) => x.id === "electricity")!.consumption * (s.production / 100) * s.tariff +
    analysis.sources.find((x) => x.id === "fuel")!.consumption * (s.production / 100) * s.fuel;

  const chart = [
    { name: "Reduction (tCO₂e)", current: +current.totalReduction.toFixed(0), scenario: +scenario.totalReduction.toFixed(0) },
    { name: "Residual (tCO₂e)", current: +current.after.toFixed(0), scenario: +scenario.after.toFixed(0) },
  ];

  return (
    <>
      <PageHeader
        title="What-if simulator"
        subtitle="Every slider re-runs the solver instantly against your live dataset."
        actions={
          <Button variant="outline" onClick={() => setS(BASE)}>
            <RotateCcw className="mr-1.5 size-4" /> Reset to current plan
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4 text-primary" /> Scenario parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderRow label="Sustainability budget" value={`₹${s.budget} Cr`} min={1} max={200} step={1} v={s.budget} onChange={(v) => setS({ ...s, budget: v })} />
            <SliderRow label="Production volume" value={`${s.production}%`} min={50} max={180} step={5} v={s.production} onChange={(v) => setS({ ...s, production: v })} />
            <SliderRow label="Grid electricity tariff" value={`₹${s.tariff.toFixed(1)} / kWh`} min={4} max={16} step={0.5} v={s.tariff} onChange={(v) => setS({ ...s, tariff: v })} />
            <SliderRow label="Fuel price" value={`₹${s.fuel} / litre`} min={60} max={180} step={2} v={s.fuel} onChange={(v) => setS({ ...s, fuel: v })} />
            <SliderRow label="Renewable energy share" value={`${s.renewable}%`} min={0} max={90} step={5} v={s.renewable} onChange={(v) => setS({ ...s, renewable: v })} />
            <SliderRow label="Carbon abatement target" value={`${s.target}%`} min={5} max={60} step={1} v={s.target} onChange={(v) => setS({ ...s, target: v })} />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <PlanCard title="Current plan" tone="muted" result={current} opex={opexCurrent} target={BASE.target} />
            <PlanCard title="Scenario plan" tone="primary" result={scenario} opex={opexScenario} target={s.target} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delta metrics</CardTitle>
              <CardDescription>Scenario minus current plan</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Delta label="Abatement" value={scenario.totalReduction - current.totalReduction} suffix=" tCO₂e" goodWhenUp />
              <Delta label="Capex" value={scenario.totalCost - current.totalCost} money />
              <Delta label="Residual emissions" value={scenario.after - current.after} suffix=" tCO₂e" />
              <Delta label="Energy opex" value={opexScenario - opexCurrent} money />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Side-by-side outcome</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="current" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} name="Current plan" />
                  <Bar dataKey="scenario" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} name="Scenario plan" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function SliderRow({
  label,
  value,
  v,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: string;
  v: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <Label>{label}</Label>
        <span className="font-semibold">{value}</span>
      </div>
      <Slider value={[v]} min={min} max={max} step={step} onValueChange={(n) => onChange(n[0]!)} />
    </div>
  );
}

function PlanCard({
  title,
  tone,
  result,
  opex,
  target,
}: {
  title: string;
  tone: "muted" | "primary";
  result: ReturnType<typeof optimise>;
  opex: number;
  target: number;
}) {
  return (
    <Card className={cn(tone === "primary" ? "border-primary/40 bg-primary/5" : "bg-muted/40")}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant={result.targetMet ? "default" : "destructive"}>
          {result.targetMet ? "Target met" : "Short of target"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <L k="Target" v={`${target}%`} />
        <L k="Abatement" v={`${t(result.totalReduction)} tCO₂e (${result.reductionPct.toFixed(1)}%)`} />
        <L k="Residual footprint" v={`${t(result.after)} tCO₂e`} />
        <L k="Capex" v={inr(result.totalCost)} />
        <L k="Budget left" v={inr(Math.max(result.budgetRemaining, 0))} />
        <L k="Annual energy opex" v={`${inr(opex)} / yr`} />
        <div className="pt-2 text-xs text-muted-foreground">
          {result.selected.map((a) => a.name).join(" · ") || "No feasible actions"}
        </div>
      </CardContent>
    </Card>
  );
}

function L({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

function Delta({
  label,
  value,
  suffix = "",
  money,
  goodWhenUp,
}: {
  label: string;
  value: number;
  suffix?: string;
  money?: boolean;
  goodWhenUp?: boolean;
}) {
  const up = value > 0;
  const good = goodWhenUp ? up : !up;
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 flex items-center gap-1 text-lg font-semibold", good ? "text-primary" : "text-destructive")}>
        {up ? "+" : "−"}
        {money ? inr(Math.abs(value)) : Math.abs(value).toFixed(0) + suffix}
        <ArrowRight className={cn("size-4", up ? "-rotate-45" : "rotate-45")} />
      </p>
    </div>
  );
}
