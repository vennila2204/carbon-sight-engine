import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_LOG } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/system")({
  head: () => ({
    meta: [
      { title: "Admin · System — Carbon Intelligence Engine" },
      { name: "description", content: "System configuration, emission factor defaults and activity audit log." },
      { property: "og:title", content: "Admin System Configuration" },
      { property: "og:description", content: "Configure solver defaults and review the audit log." },
    ],
  }),
  component: () => (
    <AppLayout adminOnly>
      <AdminSystem />
    </AppLayout>
  ),
});

function AdminSystem() {
  const [cfg, setCfg] = useState({
    gridFactor: 0.00071,
    budget: 90000000,
    target: 25,
    solverTimeout: 30,
    autoReoptimise: true,
    strictValidation: true,
  });

  return (
    <>
      <PageHeader
        title="System configuration"
        subtitle="Global defaults applied across all facilities and every solver run."
        actions={<Button onClick={() => toast.success("Configuration saved")}>Save configuration</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engine defaults</CardTitle>
            <CardDescription>Emission factors and solver parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Grid emission factor (tCO₂e / kWh)">
              <Input
                type="number"
                step={0.00001}
                value={cfg.gridFactor}
                onChange={(e) => setCfg({ ...cfg, gridFactor: Number(e.target.value) })}
              />
            </Field>
            <Field label="Default sustainability budget (₹)">
              <Input
                type="number"
                step={1000000}
                value={cfg.budget}
                onChange={(e) => setCfg({ ...cfg, budget: Number(e.target.value) })}
              />
            </Field>
            <Field label="Default reduction target (%)">
              <Input
                type="number"
                value={cfg.target}
                onChange={(e) => setCfg({ ...cfg, target: Number(e.target.value) })}
              />
            </Field>
            <Field label="Solver timeout (seconds)">
              <Input
                type="number"
                value={cfg.solverTimeout}
                onChange={(e) => setCfg({ ...cfg, solverTimeout: Number(e.target.value) })}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Toggle
                label="Automatic re-optimisation"
                hint="Re-run the solver when a disruption signal is received"
                checked={cfg.autoReoptimise}
                onChange={(v) => setCfg({ ...cfg, autoReoptimise: v })}
              />
              <Toggle
                label="Strict dataset validation"
                hint="Reject uploads with missing required fields"
                checked={cfg.strictValidation}
                onChange={(v) => setCfg({ ...cfg, strictValidation: v })}
              />
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-primary" /> System health
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Health k="Solver" v="Operational" />
              <Health k="Ingestion API" v="Mock fallback" />
              <Health k="Datasets stored" v="6" />
              <Health k="Last audit entry" v={AUDIT_LOG[0]?.at ?? "—"} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Activity audit log</CardTitle>
          <CardDescription>Immutable record of platform activity</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_LOG.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="whitespace-nowrap">{e.at}</TableCell>
                  <TableCell>{e.actor}</TableCell>
                  <TableCell className="font-medium">{e.action}</TableCell>
                  <TableCell className="text-muted-foreground">{e.target}</TableCell>
                  <TableCell>
                    <Badge variant={e.role === "ADMIN" ? "default" : "secondary"}>{e.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Health({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-semibold">{v}</p>
    </div>
  );
}
