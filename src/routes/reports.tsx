import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, Printer } from "lucide-react";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadText } from "@/api/datasetApi";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { evaluateActions, inr, optimise, t } from "@/lib/engine";
import { INDUSTRIES } from "@/lib/industries";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Auditable Reports — Carbon Intelligence Engine" },
      { name: "description", content: "Executive summary report with dataset metadata, footprint breakdown and selected actions." },
      { property: "og:title", content: "Auditable Carbon Reports" },
      { property: "og:description", content: "Print-friendly executive carbon summary with CSV export." },
    ],
  }),
  component: () => (
    <AppLayout>
      <Reports />
    </AppLayout>
  ),
});

function Reports() {
  const { analysis, dataset, industry } = useApp();
  const { user } = useAuth();

  const plan = useMemo(() => {
    if (!analysis) return null;
    return optimise(
      analysis,
      { targetPct: 25, budgetInr: 90000000, maxTimelineMonths: 18, allowProductionImpact: true },
      evaluateActions(analysis),
    );
  }, [analysis]);

  if (!analysis || !dataset || !plan) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Import a dataset to generate a report.</p>
        <Link to="/data" className="mt-4 inline-block">
          <Button>Go to Factory Data</Button>
        </Link>
      </Card>
    );
  }

  const profile = INDUSTRIES[industry];
  const generated = new Date().toLocaleString("en-IN");

  function exportCsv() {
    const lines = [
      "Section,Field,Value",
      `Dataset,Name,"${dataset!.name}"`,
      `Dataset,Facility,"${dataset!.facility}"`,
      `Dataset,Industry,"${profile.label}"`,
      `Dataset,Rows,${dataset!.rows.length}`,
      `Footprint,Total tCO2e,${analysis!.totalCO2e.toFixed(2)}`,
      `Footprint,Scope 1 tCO2e,${analysis!.scope1.toFixed(2)}`,
      `Footprint,Scope 2 tCO2e,${analysis!.scope2.toFixed(2)}`,
      `Footprint,Intensity tCO2e per tonne,${analysis!.intensity.toFixed(4)}`,
      "",
      "Source,Consumption,Unit,Emission Factor,tCO2e,Share %",
      ...analysis!.sources.map(
        (s) =>
          `"${s.name}",${s.consumption.toFixed(2)},${s.unit},${s.factor},${s.co2e.toFixed(2)},${s.share.toFixed(2)}`,
      ),
      "",
      "Selected Action,tCO2e Reduction,Cost INR,Timeline Months,Payback Years",
      ...plan!.selected.map(
        (a) => `"${a.name}",${a.reductionTonnes.toFixed(2)},${a.capexInr},${a.timelineMonths},${a.paybackYears.toFixed(2)}`,
      ),
    ];
    downloadText(`carbon-report-${dataset!.id}.csv`, lines.join("\n"));
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Auditable reports"
          subtitle="Executive summary generated from the active dataset, fully traceable to source rows."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCsv}>
                <Download className="mr-1.5 size-4" /> Export CSV
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="mr-1.5 size-4" /> Print / PDF
              </Button>
            </div>
          }
        />
      </div>

      <Card className="print-sheet">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-2xl">Carbon Footprint & Reduction Plan</CardTitle>
          <CardDescription>
            {dataset.facility} · {profile.label} · generated {generated} by {user?.name ?? "system"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              1. Dataset metadata
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <Meta k="Dataset" v={dataset.name} />
              <Meta k="Dataset ID" v={dataset.id} />
              <Meta k="Rows analysed" v={String(dataset.rows.length)} />
              <Meta k="Uploaded" v={new Date(dataset.uploadedAt).toLocaleDateString("en-IN")} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              2. Footprint breakdown
            </h3>
            <div className="mb-4 grid gap-3 sm:grid-cols-4 text-sm">
              <Meta k="Total CO₂e" v={`${t(analysis.totalCO2e)} t`} />
              <Meta k="Scope 1" v={`${t(analysis.scope1)} t`} />
              <Meta k="Scope 2" v={`${t(analysis.scope2)} t`} />
              <Meta k="Intensity" v={`${analysis.intensity.toFixed(3)} tCO₂e/t`} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Consumption</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Factor</TableHead>
                  <TableHead className="text-right">tCO₂e</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.sources.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right">{s.consumption.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell>{s.unit}</TableCell>
                    <TableCell className="text-right">{s.factor}</TableCell>
                    <TableCell className="text-right">{s.co2e.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{s.share.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              3. Selected reduction actions & budget
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">tCO₂e</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Timeline</TableHead>
                  <TableHead className="text-right">Payback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.selected.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-right">{a.reductionTonnes.toFixed(0)}</TableCell>
                    <TableCell className="text-right">{inr(a.capexInr)}</TableCell>
                    <TableCell className="text-right">{a.timelineMonths} mo</TableCell>
                    <TableCell className="text-right">{a.paybackYears.toFixed(1)} yrs</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-sm">
              Total committed capex <strong>{inr(plan.totalCost)}</strong> of a{" "}
              <strong>{inr(90000000)}</strong> sustainability budget, leaving{" "}
              <strong>{inr(Math.max(plan.budgetRemaining, 0))}</strong> uncommitted.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              4. Narrative explanation
            </h3>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Across {dataset.rows.length} reporting periods, {dataset.facility} emitted{" "}
                <strong>{t(analysis.totalCO2e)} tCO₂e</strong>, split{" "}
                {((analysis.scope1 / analysis.totalCO2e) * 100).toFixed(0)}% Scope 1 and{" "}
                {((analysis.scope2 / analysis.totalCO2e) * 100).toFixed(0)}% Scope 2. The dominant
                contributor is <strong>{analysis.topSource.name}</strong> at{" "}
                {analysis.topSource.share.toFixed(1)}% of the total footprint, making it the
                highest-leverage intervention point.
              </p>
              <p>
                Emission intensity stands at {analysis.intensity.toFixed(3)} tCO₂e per tonne of
                production against an industry benchmark of {profile.benchmarkIntensity} — a{" "}
                {analysis.intensity <= profile.benchmarkIntensity ? "favourable" : "adverse"}{" "}
                position. The 12-month trend moved{" "}
                {analysis.monthlyTrendPct >= 0 ? "up" : "down"} by{" "}
                {Math.abs(analysis.monthlyTrendPct).toFixed(1)}%.
              </p>
              <p>
                The optimiser recommends {plan.selected.length} actions delivering{" "}
                <strong>{t(plan.totalReduction)} tCO₂e</strong> ({plan.reductionPct.toFixed(1)}%)
                of abatement, reducing the residual footprint to {t(plan.after)} tCO₂e. Selection
                maximises tonnes abated per rupee under the stated budget, timeline and
                production-continuity constraints.
              </p>
            </div>
          </section>

          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            Report ID RPT-{dataset.id.toUpperCase()}-{new Date().getFullYear()} · figures computed
            from raw uploaded rows using published emission factors · auditable end to end.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-semibold">{v}</p>
    </div>
  );
}
