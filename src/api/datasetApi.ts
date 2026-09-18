import axios from "axios";
import * as XLSX from "xlsx";

import { ADMIN_DATASETS, makeDataset } from "@/lib/mockData";
import type { DatasetRow, FactoryDataset, ParsedFile } from "@/lib/types";

const client = axios.create({ baseURL: "/api", timeout: 8000 });

export const MAX_FILE_MB = 10;
export const ACCEPTED = [".csv", ".xlsx", ".xls"];

export function validateFile(file: File): string | null {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ACCEPTED.includes(ext)) return `Unsupported file type "${ext}". Upload a CSV or XLSX file.`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `File is too large (max ${MAX_FILE_MB} MB).`;
  if (file.size === 0) return "That file appears to be empty.";
  return null;
}

/** Parse a CSV/XLSX file entirely in the browser. */
export async function parseFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("No sheet found in this file.");
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<DatasetRow>(sheet!, { defval: "" });
  const columns = rows.length ? Object.keys(rows[0] as object) : [];
  let missing = 0;
  rows.forEach((r) => {
    columns.forEach((c) => {
      const v = r[c];
      if (v === "" || v === null || v === undefined) missing += 1;
    });
  });
  return {
    fileName: file.name,
    sizeKb: Math.round(file.size / 1024),
    columns,
    rows,
    rowCount: rows.length,
    missingValues: missing,
  };
}

export interface UploadResponse {
  datasetId: string;
  storedAs: string;
  receivedRows: number;
  source: "api" | "mock";
}

/**
 * Uploads the raw file as multipart/form-data to POST /api/datasets/upload.
 * Falls back to an in-memory mock service when the backend is unavailable,
 * so the product stays fully demoable offline.
 */
export async function uploadDataset(
  file: File,
  meta: { facility: string; industry: string; mapping: Record<string, string | undefined> },
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("facility", meta.facility);
  form.append("industry", meta.industry);
  form.append("mapping", JSON.stringify(meta.mapping));

  try {
    const res = await client.post<UploadResponse>("/datasets/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
      },
    });
    return { ...res.data, source: "api" };
  } catch {
    return mockUpload(file, onProgress);
  }
}

async function mockUpload(file: File, onProgress?: (pct: number) => void): Promise<UploadResponse> {
  for (let p = 0; p <= 100; p += 10) {
    onProgress?.(p);
    await new Promise((r) => setTimeout(r, 55));
  }
  return {
    datasetId: "ds-" + Math.random().toString(36).slice(2, 8),
    storedAs: file.name,
    receivedRows: 0,
    source: "mock",
  };
}

/** Lists datasets from the API, falling back to realistic sample factory datasets. */
export async function listDatasets(): Promise<FactoryDataset[]> {
  try {
    const res = await client.get<FactoryDataset[]>("/datasets");
    if (Array.isArray(res.data) && res.data.length) return res.data;
    throw new Error("empty");
  } catch {
    return ADMIN_DATASETS;
  }
}

export async function deleteDataset(id: string): Promise<void> {
  try {
    await client.delete(`/datasets/${id}`);
  } catch {
    /* mock fallback: handled optimistically in the UI */
  }
}

export function datasetToCsv(dataset: FactoryDataset): string {
  const head = dataset.columns.join(",");
  const body = dataset.rows.map((r) => dataset.columns.map((c) => r[c] ?? "").join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { makeDataset };
