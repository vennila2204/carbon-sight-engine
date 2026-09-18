import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { analyseDataset } from "@/lib/engine";
import { SAMPLE_DATASET } from "@/lib/mockData";
import type { AnalysisResult, FactoryDataset, IndustryKey } from "@/lib/types";

interface UploadHistoryItem {
  id: string;
  name: string;
  rows: number;
  sizeKb: number;
  at: string;
  status: "Imported" | "Replaced" | "Removed";
  source: "api" | "mock";
}

interface AppValue {
  industry: IndustryKey;
  setIndustry: (i: IndustryKey) => void;
  dataset: FactoryDataset | null;
  setDataset: (d: FactoryDataset | null) => void;
  analysis: AnalysisResult | null;
  history: UploadHistoryItem[];
  addHistory: (h: UploadHistoryItem) => void;
}

const AppContext = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [industry, setIndustry] = useState<IndustryKey>("textile");
  const [dataset, setDataset] = useState<FactoryDataset | null>(SAMPLE_DATASET);
  const [history, setHistory] = useState<UploadHistoryItem[]>([
    {
      id: SAMPLE_DATASET.id,
      name: SAMPLE_DATASET.name,
      rows: SAMPLE_DATASET.rows.length,
      sizeKb: SAMPLE_DATASET.sizeKb,
      at: "18 Sep 2026, 08:12",
      status: "Imported",
      source: "mock",
    },
  ]);

  const analysis = useMemo(
    () => (dataset ? analyseDataset(dataset, industry) : null),
    [dataset, industry],
  );

  const value = useMemo<AppValue>(
    () => ({
      industry,
      setIndustry,
      dataset,
      setDataset,
      analysis,
      history,
      addHistory: (h) => setHistory((prev) => [h, ...prev]),
    }),
    [industry, dataset, analysis, history],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export type { UploadHistoryItem };
