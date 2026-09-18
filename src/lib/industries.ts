import type { IndustryKey, IndustryProfile } from "./types";

function base(
  key: IndustryKey,
  label: string,
  unit: string,
  gridFactor: number,
  benchmarkIntensity: number,
  processLabel: string,
  processFactor: number,
): IndustryProfile {
  return {
    key,
    label,
    unit,
    gridFactor,
    benchmarkIntensity,
    sources: [
      {
        id: "electricity",
        label: "Grid Electricity",
        unit: "kWh",
        factor: gridFactor,
        scope: 2,
        field: "electricity",
        category: "energy",
      },
      {
        id: "fuel",
        label: "Diesel / Furnace Fuel",
        unit: "litres",
        factor: 0.00268,
        scope: 1,
        field: "fuel",
        category: "fuel",
      },
      {
        id: "process",
        label: processLabel,
        unit: "tonnes",
        factor: processFactor,
        scope: 1,
        field: "process",
        category: "process",
      },
      {
        id: "transport",
        label: "Inbound / Outbound Transport",
        unit: "tonne-km",
        factor: 0.00012,
        scope: 1,
        field: "transport",
        category: "logistics",
      },
      {
        id: "waste",
        label: "Process Waste & Effluent",
        unit: "tonnes",
        factor: 0.42,
        scope: 1,
        field: "waste",
        category: "waste",
      },
    ],
  };
}

export const INDUSTRIES: Record<IndustryKey, IndustryProfile> = {
  textile: base("textile", "Textile", "tonne of fabric", 0.00071, 2.4, "Dyeing & Steam Process", 0.31),
  automotive: base("automotive", "Automotive", "vehicle unit", 0.00071, 1.6, "Paint Shop & Welding", 0.22),
  chemical: base("chemical", "Chemical", "tonne of product", 0.00071, 3.1, "Reaction & Cracking Process", 0.64),
  food: base("food", "Food & Beverage", "tonne of output", 0.00071, 1.2, "Refrigeration & Boiling", 0.18),
  cement: base("cement", "Cement", "tonne of clinker", 0.00071, 5.8, "Calcination Process", 0.86),
  general: base("general", "General Manufacturing", "production unit", 0.00071, 1.8, "General Process Heat", 0.24),
};

export const INDUSTRY_LIST = Object.values(INDUSTRIES);
