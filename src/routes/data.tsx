import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCcw,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { parseFile, uploadDataset, validateFile } from "@/api/datasetApi";
import { SAMPLE_DATASET } from "@/lib/mockData";
import type { ColumnMapping, MappableField, ParsedFile } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Factory Data — Carbon Intelligence Engine" },
      { name: "description", content: "Upload, validate and map factory energy and production datasets." },
      { property: "og:title", content: "Factory Dataset Ingestion" },
      { property: "og:description", content: "Upload, validate and map factory energy and production datasets." },
    ],
  }),
  component: () => (
    <AppLayout>
      <FactoryData />
    </AppLayout>
  ),
});

const REQUIRED_FIELDS: { field: MappableField; label: string; required: boolean }[] = [
  { field: "month", label: "Reporting period / month", required: true },
  { field: "electricity", label: "Electricity consumption (kWh)", required: true },
  { field: "fuel", label: "Diesel / fuel (litres)", required: true },
  { field: "production", label: "Production output (tonnes / units)", required: true },
  { field: "process", label: "Process throughput (tonnes)", required: false },
  { field: "transport", label: "Transport (tonne-km)", required: false },
  { field: "waste", label: "Waste / effluent (tonnes)", required: false },
];

const GUESSES: Record<MappableField, string[]> = {
  month: ["month", "period", "date"],
  electricity: ["electric", "kwh", "power", "energy"],
  fuel: ["diesel", "fuel", "furnace", "litre", "liter"],
  production: ["production", "output_tonnes", "units", "produced"],
  process: ["process", "steam", "clinker", "throughput"],
  transport: ["transport", "logistic", "tonnekm", "tkm", "freight"],
  waste: ["waste", "effluent", "scrap", "sludge"],
};

function autoMap(columns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  (Object.keys(GUESSES) as MappableField[]).forEach((f) => {
    const hit = columns.find((c) => GUESSES[f].some((g) => c.toLowerCase().replace(/[^a-z]/g, "").includes(g)));
    if (hit) mapping[f] = hit;
  });
  return mapping;
}

function FactoryData() {
  const { dataset, setDataset, industry, history, addHistory } = useApp();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (f: File) => {
    setError("");
    const invalid = validateFile(f);
    if (invalid) {
      setError(invalid);
      toast.error(invalid);
      return;
    }
    setBusy(true);
    setProgress(0);
    setFile(f);
    try {
      const result = await parseFile(f);
      for (let p = 20; p <= 100; p += 20) {
        setProgress(p);
        await new Promise((r) => setTimeout(r, 70));
      }
      setParsed(result);
      setMapping(autoMap(result.columns));
      toast.success(`Parsed ${result.rowCount} rows from ${f.name}`);
    } catch {
      setError("We couldn't read that file. Check that the first sheet has a header row.");
      toast.error("Could not read that file");
    } finally {
      setBusy(false);
    }
  }, []);

  const missingRequired = REQUIRED_FIELDS.filter((f) => f.required && !mapping[f.field]);

  const importDataset = async () => {
    if (!parsed || !file) return;
    setBusy(true);
    const res = await uploadDataset(
      file,
      { facility: user?.facility ?? "Unknown", industry, mapping: mapping as Record<string, string> },
      setProgress,
    );
    setDataset({
      id: res.datasetId,
      name: parsed.fileName,
      facility: user?.facility ?? "Unknown facility",
      industry,
      uploadedBy: user?.email ?? "unknown",
      uploadedAt: new Date().toISOString(),
      sizeKb: parsed.sizeKb,
      rows: parsed.rows,
      columns: parsed.columns,
      mapping,
      status: "active",
    });
    addHistory({
      id: res.datasetId,
      name: parsed.fileName,
      rows: parsed.rowCount,
      sizeKb: parsed.sizeKb,
      at: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      status: "Imported",
      source: res.source,
    });
    setBusy(false);
    toast.success(
      res.source === "api"
        ? "Dataset uploaded to the carbon engine"
        : "Dataset imported locally (backend offline — mock service used)",
    );
  };

  const clearStaged = () => {
    setFile(null);
    setParsed(null);
    setMapping({});
    setProgress(0);
    setError("");
  };

  return (
    <>
      <PageHeader
        title="Factory data"
        subtitle="Ingest CSV or XLSX factory datasets, validate them and map columns to engine fields."
        actions={
          <>
            <Button variant="outline" onClick={() => setDataset(SAMPLE_DATASET)}>
              <RefreshCcw className="mr-1.5 size-4" /> Load sample dataset
            </Button>
            {dataset && (
              <Button variant="outline" onClick={() => setDataset(null)}>
                <Trash2 className="mr-1.5 size-4" /> Remove active dataset
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload dataset</CardTitle>
            <CardDescription>CSV or XLSX, up to 10 MB. Parsed instantly in your browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void handleFile(f);
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40",
              )}
            >
              <UploadCloud className={cn("size-10", dragging ? "text-primary" : "text-muted-foreground")} />
              <p className="mt-3 text-sm font-medium">Drag & drop your factory dataset here</p>
              <p className="mt-1 text-xs text-muted-foreground">or</p>
              <Button variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
                <Upload className="mr-1.5 size-4" /> Browse files
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4" /> {error}
              </p>
            )}

            {(busy || progress > 0) && file && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span className="truncate">{file.name}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active dataset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dataset ? (
              <>
                <Row k="File" v={dataset.name} />
                <Row k="Facility" v={dataset.facility} />
                <Row k="Rows" v={String(dataset.rows.length)} />
                <Row k="Columns" v={String(dataset.columns.length)} />
                <Row k="Size" v={`${dataset.sizeKb} KB`} />
                <Row k="Uploaded by" v={dataset.uploadedBy} />
                <Badge className="mt-2">Feeding the analysis engine</Badge>
              </>
            ) : (
              <p className="text-muted-foreground">
                No active dataset. Import one to populate analysis and optimisation.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {parsed && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Rows detected" value={parsed.rowCount.toLocaleString()} />
            <Stat label="Columns detected" value={String(parsed.columns.length)} />
            <Stat label="Missing values" value={parsed.missingValues.toLocaleString()} tone={parsed.missingValues > 0 ? "warn" : "ok"} />
            <Stat label="File size" value={`${parsed.sizeKb} KB`} />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Column mapping</CardTitle>
              <CardDescription>
                Match your uploaded headers to the fields the carbon engine needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {REQUIRED_FIELDS.map(({ field, label, required }) => {
                const value = mapping[field];
                return (
                  <div key={field} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      {value ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : required ? (
                        <AlertCircle className="size-4 text-destructive" />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">optional</span>
                      )}
                    </div>
                    <Select
                      value={value ?? "__none"}
                      onValueChange={(v) =>
                        setMapping((m) => ({ ...m, [field]: v === "__none" ? undefined : v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Not mapped</SelectItem>
                        {parsed.columns.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>First 15 rows of {parsed.fileName}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearStaged}>
                  Discard
                </Button>
                <Button
                  onClick={importDataset}
                  disabled={busy || missingRequired.length > 0}
                  title={missingRequired.length ? "Map all required fields first" : undefined}
                >
                  <FileSpreadsheet className="mr-1.5 size-4" />
                  {dataset ? "Replace dataset" : "Import dataset"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {missingRequired.length > 0 && (
                <p className="mb-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" /> Map required fields:{" "}
                  {missingRequired.map((m) => m.label).join(", ")}
                </p>
              )}
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parsed.columns.map((c) => (
                        <TableHead key={c} className="whitespace-nowrap">
                          {c}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.rows.slice(0, 15).map((r, i) => (
                      <TableRow key={i}>
                        {parsed.columns.map((c) => (
                          <TableCell key={c} className="whitespace-nowrap">
                            {String(r[c] ?? "—")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Channel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id + h.at}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>{h.rows}</TableCell>
                    <TableCell>{h.sizeKb} KB</TableCell>
                    <TableCell className="whitespace-nowrap">{h.at}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{h.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {h.source === "api" ? "API" : "Mock service"}
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <Card className="gap-1 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-semibold", tone === "warn" && "text-chart-4")}>{value}</p>
    </Card>
  );
}
