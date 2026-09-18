import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CircleDollarSign, Clock, Layers, Leaf, TrendingDown } from "lucide-react";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { ACTION_CATALOG, BUNDLES, evaluateActions, inr } from "@/lib/engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Reduction Actions — Carbon Intelligence Engine" },
      { name: "description", content: "Catalogue of abatement actions and combination bundles with cost, timeline and payback." },
      { property: "og:title", content: "Reduction Actions Catalogue" },
      { property: "og:description", content: "Abatement actions and bundles with cost, timeline and payback." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Actions />
    </AppLayout>
  ),
});

function Actions() {
  const { analysis } = useApp();
  const [selected, setSelected] = useState<string[]>(["motors", "boiler"]);

  const evaluated = useMemo(
    () => (analysis ? evaluateActions(analysis) : []),
    [analysis],
  );

  if (!analysis) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Import a dataset to size reduction actions.</p>
        <Link to="/data" className="mt-4 inline-block">
          <Button>Go to Factory Data</Button>
        </Link>
      </Card>
    );
  }

  const selectedActions = evaluated.filter((a) => selected.includes(a.id));
  const selCost = selectedActions.reduce((s, a) => s + a.capexInr, 0);
  const selRed = selectedActions.reduce((s, a) => s + a.reductionTonnes, 0);

  return (
    <>
      <PageHeader
        title="Reduction actions"
        subtitle="Sized against your active dataset — every figure is derived from your own consumption data."
        actions={
          <Link to="/optimize">
            <Button>Send to optimiser</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {evaluated.map((a) => {
          const isOn = selected.includes(a.id);
          return (
            <Card
              key={a.id}
              className={cn("cursor-pointer transition-shadow hover:shadow-md", isOn && "ring-2 ring-primary")}
              onClick={() =>
                setSelected((s) => (s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]))
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  <Badge variant={isOn ? "default" : "secondary"}>{a.category}</Badge>
                </div>
                <CardDescription>{a.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Metric icon={Leaf} label="Reduction" value={`${a.reductionTonnes.toFixed(0)} tCO₂e`} />
                <Metric icon={CircleDollarSign} label="Capex" value={inr(a.capexInr)} />
                <Metric icon={Clock} label="Timeline" value={`${a.timelineMonths} months`} />
                <Metric
                  icon={TrendingDown}
                  label="Payback"
                  value={Number.isFinite(a.paybackYears) ? `${a.paybackYears.toFixed(1)} yrs` : "—"}
                />
                <div className="col-span-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Cost per tonne abated</span>
                  <span className="font-semibold">
                    {Number.isFinite(a.costPerTonne) ? inr(a.costPerTonne) : "—"}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  Production impact: <span className="font-medium text-foreground">{a.productionImpact}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4 text-primary" /> Combination bundles
          </CardTitle>
          <CardDescription>Pre-built portfolios compared head to head</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {BUNDLES.map((b) => {
            const items = evaluated.filter((a) => b.actionIds.includes(a.id));
            const cost = items.reduce((s, a) => s + a.capexInr, 0);
            const red = items.reduce((s, a) => s + a.reductionTonnes, 0);
            const saving = items.reduce((s, a) => s + a.annualSavingInr, 0);
            const timeline = Math.max(...items.map((a) => a.timelineMonths));
            const impact = items.some((a) => a.productionImpact === "Medium")
              ? "Medium"
              : items.some((a) => a.productionImpact === "Low")
                ? "Low"
                : "None";
            return (
              <Card key={b.id} className="bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-base">{b.name}</CardTitle>
                  <CardDescription>{items.map((i) => i.name).join(" · ")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Line k="Total cost" v={inr(cost)} />
                  <Line k="Expected reduction" v={`${red.toFixed(0)} tCO₂e (${((red / analysis.totalCO2e) * 100).toFixed(1)}%)`} />
                  <Line k="Annual savings" v={`${inr(saving)} / yr`} />
                  <Line k="Implementation" v={`${timeline} months`} />
                  <Line k="Production impact" v={impact} />
                  <Line k="Payback" v={saving > 0 ? `${(cost / saving).toFixed(1)} yrs` : "—"} />
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => setSelected(b.actionIds)}
                  >
                    Select this bundle
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your selection ({selectedActions.length} actions)</CardTitle>
          <CardDescription>
            {inr(selCost)} capex · {selRed.toFixed(0)} tCO₂e abated ·{" "}
            {((selRed / analysis.totalCO2e) * 100).toFixed(1)}% of footprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Reduction (tCO₂e)</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">₹ / tonne</TableHead>
                  <TableHead className="text-right">Timeline</TableHead>
                  <TableHead>Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedActions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-right">{a.reductionTonnes.toFixed(0)}</TableCell>
                    <TableCell className="text-right">{inr(a.capexInr)}</TableCell>
                    <TableCell className="text-right">
                      {Number.isFinite(a.costPerTonne) ? inr(a.costPerTonne) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{a.timelineMonths} mo</TableCell>
                    <TableCell>{a.productionImpact}</TableCell>
                  </TableRow>
                ))}
                {!selectedActions.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Select actions above to build a portfolio.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Catalogue contains {ACTION_CATALOG.length} actions across renewable energy, efficiency,
            thermal, logistics and circularity levers.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
