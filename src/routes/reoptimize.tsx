import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Factory, Fuel, RefreshCw, Zap } from "lucide-react";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { evaluateActions, inr, optimise, t } from "@/lib/engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reoptimize")({
  head: () => ({
    meta: [
      { title: "Dynamic Re-Optimisation — Carbon Intelligence Engine" },
      { name: "description", content: "Trigger disruption events and compare the old plan against a re-optimised plan." },
      { property: "og:title", content: "Dynamic Re-Optimisation" },
      { property: "og:description", content: "Compare the old plan against a re-optimised plan after a disruption." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Reopt />
    </AppLayout>
  ),
});

const TRIGGERS = [
  {
    id: "fuel",
    name: "Fuel price surge",
    detail: "Diesel up 38% — thermal levers gain value, logistics capex rises",
    icon: Fuel,
    renewablePct: 10,
    productionScale: 1,
    budgetFactor: 0.9,
    targetPct: 25,
  },
  {
    id: "grid",
    name: "Grid outage / tariff spike",
    detail: "Grid unreliable for 3 months — on-site generation prioritised",
    icon: Zap,
    renewablePct: 35,
    productionScale: 1,
    budgetFactor: 1.15,
    targetPct: 30,
  },
  {
    id: "production",
    name: "Production increase",
    detail: "New order book lifts output 28% — footprint and abatement both scale",
    icon: Factory,
    renewablePct: 10,
    productionScale: 1.28,
    budgetFactor: 1,
    targetPct: 25,
  },
  {
    id: "budget",
    name: "Budget cut",
    detail: "Capex frozen at 55% — solver must protect cheapest tonnes",
    icon: AlertTriangle,
    renewablePct: 10,
    productionScale: 1,
    budgetFactor: 0.55,
    targetPct: 25,
  },
] as const;

const BASE_BUDGET = 90000000;

function Reopt() {
  const { analysis } = useApp();
  const [triggerId, setTriggerId] = useState<string>("fuel");

  const trigger = TRIGGERS.find((x) => x.id === triggerId)!;

  const { oldPlan, newPlan } = useMemo(() => {
    if (!analysis) return { oldPlan: null, newPlan: null };
    const basePool = evaluateActions(analysis);
    return {
      oldPlan: optimise(analysis, { targetPct: 25, budgetInr: BASE_BUDGET, maxTimelineMonths: 18, allowProductionImpact: true }, basePool),
      newPlan: optimise(
        analysis,
        {
          targetPct: trigger.targetPct,
          budgetInr: BASE_BUDGET * trigger.budgetFactor,
          maxTimelineMonths: 18,
          allowProductionImpact: true,
        },
        evaluateActions(analysis, undefined, {
          renewablePct: trigger.renewablePct,
          productionScale: trigger.productionScale,
        }),
      ),
    };
  }, [analysis, trigger]);

  if (!analysis || !oldPlan || !newPlan) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Import a dataset before re-optimising.</p>
        <Link to="/data" className="mt-4 inline-block">
          <Button>Go to Factory Data</Button>
        </Link>
      </Card>
    );
  }

  const added = newPlan.selected.filter((a) => !oldPlan.selected.some((b) => b.id === a.id));
  const dropped = oldPlan.selected.filter((a) => !newPlan.selected.some((b) => b.id === a.id));

  return (
    <>
      <PageHeader
        title="Dynamic re-optimisation"
        subtitle="When reality moves, the plan moves with it. Fire a disruption and watch the solver respond."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TRIGGERS.map((tr) => {
          const Icon = tr.icon;
          const on = tr.id === triggerId;
          return (
            <Card
              key={tr.id}
              onClick={() => setTriggerId(tr.id)}
              className={cn("cursor-pointer transition hover:shadow-md", on && "border-primary bg-primary/5 ring-2 ring-primary")}
            >
              <CardHeader>
                <Icon className={cn("size-5", on ? "text-primary" : "text-muted-foreground")} />
                <CardTitle className="text-base">{tr.name}</CardTitle>
                <CardDescription className="text-xs">{tr.detail}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <RefreshCw className="size-4 text-primary" />
        <span>
          Re-optimised for <strong>{trigger.name}</strong> — {added.length} action(s) added,{" "}
          {dropped.length} dropped.
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PlanPanel title="Old plan" subtitle="Pre-disruption baseline" plan={oldPlan} budget={BASE_BUDGET} tone="muted" />
        <PlanPanel
          title="Re-optimised plan"
          subtitle={`Adapted to: ${trigger.name}`}
          plan={newPlan}
          budget={BASE_BUDGET * trigger.budgetFactor}
          tone="primary"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Plan diff</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Added</p>
            <ul className="space-y-1 text-sm">
              {added.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span>{a.name}</span>
                  <span className="text-muted-foreground">{inr(a.capexInr)}</span>
                </li>
              ))}
              {!added.length && <li className="text-muted-foreground">No new actions</li>}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-destructive">Dropped</p>
            <ul className="space-y-1 text-sm">
              {dropped.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span>{a.name}</span>
                  <span className="text-muted-foreground">{inr(a.capexInr)}</span>
                </li>
              ))}
              {!dropped.length && <li className="text-muted-foreground">No actions removed</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function PlanPanel({
  title,
  subtitle,
  plan,
  budget,
  tone,
}: {
  title: string;
  subtitle: string;
  plan: ReturnType<typeof optimise>;
  budget: number;
  tone: "muted" | "primary";
}) {
  return (
    <Card className={cn(tone === "primary" ? "border-primary/40 bg-primary/5" : "bg-muted/30")}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
        <Badge variant={plan.targetMet ? "default" : "destructive"}>
          {plan.reductionPct.toFixed(1)}% abated
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat k="Abatement" v={`${t(plan.totalReduction)} t`} />
          <Stat k="Residual" v={`${t(plan.after)} t`} />
          <Stat k="Capex" v={inr(plan.totalCost)} />
          <Stat k="Budget" v={inr(budget)} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead className="text-right">tCO₂e</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.selected.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell className="text-right">{a.reductionTonnes.toFixed(0)}</TableCell>
                <TableCell className="text-right">{inr(a.capexInr)}</TableCell>
              </TableRow>
            ))}
            {!plan.selected.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No feasible actions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-background/70 p-2">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-semibold">{v}</p>
    </div>
  );
}
