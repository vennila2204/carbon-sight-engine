import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Eye, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { datasetToCsv, downloadText } from "@/api/datasetApi";
import { ADMIN_DATASETS } from "@/lib/mockData";
import type { FactoryDataset } from "@/lib/types";
import { INDUSTRIES } from "@/lib/industries";

export const Route = createFileRoute("/admin/datasets")({
  head: () => ({
    meta: [
      { title: "Admin · Datasets — Carbon Intelligence Engine" },
      { name: "description", content: "Manage every uploaded factory dataset across facilities." },
      { property: "og:title", content: "Admin Dataset Management" },
      { property: "og:description", content: "Search, preview, replace and delete factory datasets." },
    ],
  }),
  component: () => (
    <AppLayout adminOnly>
      <AdminDatasets />
    </AppLayout>
  ),
});

const PAGE_SIZE = 5;

function AdminDatasets() {
  const [rows, setRows] = useState<FactoryDataset[]>(ADMIN_DATASETS);
  const [q, setQ] = useState("");
  const [ind, setInd] = useState("all");
  const [sort, setSort] = useState<"date" | "name" | "rows">("date");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<FactoryDataset | null>(null);

  const filtered = useMemo(() => {
    const list = rows
      .filter((d) => (ind === "all" ? true : d.industry === ind))
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q.toLowerCase()) ||
          d.facility.toLowerCase().includes(q.toLowerCase()) ||
          d.id.toLowerCase().includes(q.toLowerCase()),
      );
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "rows") return b.rows.length - a.rows.length;
      return +new Date(b.uploadedAt) - +new Date(a.uploadedAt);
    });
  }, [rows, q, ind, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Dataset management"
        subtitle="Every factory dataset across all facilities, with full lifecycle control."
      />

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>All datasets ({filtered.length})</CardTitle>
            <CardDescription>Search, filter, sort and manage</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Search name, facility or ID"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="sm:w-56"
            />
            <Select value={ind} onValueChange={(v) => { setInd(v); setPage(1); }}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {Object.values(INDUSTRIES).map((i) => (
                  <SelectItem key={i.key} value={i.key}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Newest first</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="rows">Most rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.id}</p>
                    </TableCell>
                    <TableCell>{d.facility}</TableCell>
                    <TableCell>{INDUSTRIES[d.industry].label}</TableCell>
                    <TableCell className="text-right">{d.rows.length}</TableCell>
                    <TableCell>{new Date(d.uploadedAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge variant={d.status === "active" ? "default" : "secondary"}>{d.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Preview" onClick={() => setPreview(d)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Download"
                          onClick={() => downloadText(`${d.id}.csv`, datasetToCsv(d))}
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Replace"
                          onClick={() => toast.success(`${d.name} queued for replacement`)}
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete"
                          onClick={() => {
                            setRows((r) => r.filter((x) => x.id !== d.id));
                            toast.success(`${d.name} deleted`);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!current.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No datasets match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Preview · {preview.name}</CardTitle>
              <CardDescription>{preview.facility} · first 10 rows</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(preview.rows[0] ?? {}).map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.slice(0, 10).map((r, i) => (
                  <TableRow key={i}>
                    {Object.keys(preview.rows[0] ?? {}).map((c) => (
                      <TableCell key={c}>{String(r[c] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
