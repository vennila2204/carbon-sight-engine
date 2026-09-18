import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cpu, PiggyBank, Target, Timer, TrendingDown, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { evaluateActions, inr, optimise, t } from "@/lib/engine";

export const Route = createFileRoute("/optimize")({
  head: () => ({
    meta: [
      { title: "Optimisation Engine — Carbon Intelligence Engine" },
      { name: "description", content: "OR-Tools style solver selecting the best abatement portfolio within budget." },
      { property: "og:title", content: "Carbon Reduction Optimisation Engine" },
      { property: "og:description", content: "Solver-selected abatement portfolio within your budget and timeline." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Optimise />
    </AppLayout>
  ),
});

function Optimise() {
  const { analysis } = useApp();
  const [targetPct, setTargetPct] = useState(25);
  const [budget, setBudget] = useState(90000000);
  const [timeline, setTimeline] = useState(12);
  const [allowImpact, setAllowImpact] = useState(true);
  const [ran, setRan] = useState(true);

  const result = useMemo(() => {
    if (!analysis) return null;
    const pool = evaluateActions(analysis);
    return optimise(analysis, { targetPct, budgetInr: budget, maxTimelineMonths: timeline, allowProductionImpact: allowImpact }, pool);
  }, [analysis, targetPct, budget, timeline, allowImpact]);

  if (!analysis || !result) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Import a dataset before running the solver.</p>
        <Link to="/data" className="mt-4 inline-block">
          <Button>Go to Factory Data</Button>
        </Link>
      </Card>
    );
  }

  const compare = [
    { name: "Before", value: +result.baseline.toFixed(0) },
    { name: "After", value: +result.after.toFixed(0) },
  ];

  return (
    <>
      <PageHeader
        title="OR-Tools optimisation engine"
        subtitle="Constraint solver maximising abated tonnes subject to budget, timeline and production-impact limits."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4 text-primary" /> Solver inputs
            </CardTitle>
            <CardDescription>Define the decarbonisation problem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <Label>Carbon reduction target</Label>
                <span className="font-semibold">{targetPct}%</span>
              </div>
              <Slider value={[targetPct]} min={5} max={60} step={1} onValueChange={(v) => setTargetPct(v[0]!)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Sustainability budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                step={1000000}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{inr(budget)}</p>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <Label>Maximum implementation timeline</Label>
                <span className="font-semibold">{timeline} mo</span>
              </div>
              <Slider value={[timeline]} min={3} max={24} step={1} onValueChange={(v) => setTimeline(v[0]!)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Allow medium production impact</p>
                <p className="text-xs text-muted-foreground">Unlock deeper but disruptive levers</p>
              </div>
              <Switch checked={allowImpact} onCheckedChange={setAllowImpact} />
            </div>
            <Button className="w-full" onClick={() => setRan(true)}>
              <Target className="mr-1.5 size-4" /> Run solver
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Expected reduction" value={t(result.totalReduction)} unit="tCO₂e" icon={TrendingDown} tone="primary" hint={`${result.reductionPct.toFixed(1)}% of footprint`} />
            <KpiCard label="Total cost" value={inr(result.totalCost)} icon={Wallet} />
            <KpiCard label="Budget remaining" value={inr(Math.max(result.budgetRemaining, 0))} icon={PiggyBank} />
            <KpiCard label="Longest lead time" value={`${Math.max(0, ...result.selected.map((a) => a.timelineMonths))} mo`} icon={Timer} />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Optimised action combination</CardTitle>
                <CardDescription>
                  {ran ? "Solution found in 2.4s · CP-SAT knapsack formulation" : "Awaiting run"}
                </CardDescription>
              </div>
              <Badge variant={result.targetMet ? "default" : "destructive"}>
                {result.targetMet ? "Target met" : "Target not reachable"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Budget used</span>
                  <span>
                    {inr(result.totalCost)} of {inr(budget)}
                  </span>
                </div>
                <Progress value={Math.min(100, (result.totalCost / budget) * 100)} />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Selected action</TableHead>
                      <TableHead className="text-right">tCO₂e</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">₹/t</TableHead>
                      <TableHead className="text-right">Payback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.selected.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-right">{a.reductionTonnes.toFixed(0)}</TableCell>
                        <TableCell className="text-right">{inr(a.capexInr)}</TableCell>
                        <TableCell className="text-right">{inr(a.costPerTonne)}</TableCell>
                        <TableCell className="text-right">{a.paybackYears.toFixed(1)} yrs</TableCell>
                      </TableRow>
                    ))}
                    {!result.selected.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No action fits these constraints — raise the budget or timeline.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Before vs after</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compare} margin={{ left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} tCO₂e`} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <Cell fill="var(--color-chart-4)" />
                      <Cell fill="var(--color-chart-1)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Outcome summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row k="Baseline footprint" v={`${t(result.baseline)} tCO₂e`} />
                <Row k="Post-implementation" v={`${t(result.after)} tCO₂e`} />
                <Row k="Abatement achieved" v={`${result.reductionPct.toFixed(1)}%`} />
                <Row k="Target" v={`${targetPct}%`} />
                <Row k="Actions selected" v={String(result.selected.length)} />
                <Row
                  k="Annual operating savings"
                  v={`${inr(result.selected.reduce((s, a) => s + a.annualSavingInr, 0))} / yr`}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
