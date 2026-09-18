import type { FactoryDataset, IndustryKey } from "./types";

const MONTHS = [
  "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026",
  "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026",
];

const COLUMNS = [
  "Month",
  "Electricity_kWh",
  "Diesel_Litres",
  "Process_Output_Tonnes",
  "Production_Tonnes",
  "Transport_TonneKm",
  "Waste_Tonnes",
];

export const DEFAULT_MAPPING = {
  month: "Month",
  electricity: "Electricity_kWh",
  fuel: "Diesel_Litres",
  process: "Process_Output_Tonnes",
  production: "Production_Tonnes",
  transport: "Transport_TonneKm",
  waste: "Waste_Tonnes",
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export function makeRows(seed = 7, scale = 1) {
  const rnd = seeded(seed);
  return MONTHS.map((m, i) => {
    const season = 1 + Math.sin((i / 12) * Math.PI * 2) * 0.12;
    const drift = 1 + i * 0.008;
    const j = (x: number) => Math.round(x * season * drift * scale * (0.94 + rnd() * 0.12));
    return {
      Month: m,
      Electricity_kWh: j(1_240_000),
      Diesel_Litres: j(42_000),
      Process_Output_Tonnes: j(3_100),
      Production_Tonnes: j(4_250),
      Transport_TonneKm: j(310_000),
      Waste_Tonnes: j(180),
    };
  });
}

export function makeDataset(partial: Partial<FactoryDataset> & { id: string }): FactoryDataset {
  const rows = partial.rows ?? makeRows(partial.id.length * 13, 1);
  return {
    name: "factory_energy_2026.csv",
    facility: "Coimbatore Plant 1",
    industry: "textile" as IndustryKey,
    uploadedBy: "operations@factory.in",
    uploadedAt: new Date().toISOString(),
    sizeKb: 148,
    columns: COLUMNS,
    mapping: DEFAULT_MAPPING,
    status: "active",
    ...partial,
    rows,
  };
}

export const SAMPLE_DATASET = makeDataset({
  id: "ds-001",
  name: "coimbatore_plant1_2026.csv",
  facility: "Coimbatore Plant 1",
  industry: "textile",
});

export const ADMIN_DATASETS: FactoryDataset[] = [
  SAMPLE_DATASET,
  makeDataset({
    id: "ds-002",
    name: "pune_auto_line_2026.xlsx",
    facility: "Pune Assembly Unit",
    industry: "automotive",
    uploadedBy: "plant.head@autoworks.in",
    sizeKb: 212,
    rows: makeRows(21, 0.82),
  }),
  makeDataset({
    id: "ds-003",
    name: "dahej_chem_block_b.csv",
    facility: "Dahej Chemical Block B",
    industry: "chemical",
    uploadedBy: "esg@chemcorp.in",
    sizeKb: 331,
    rows: makeRows(33, 1.45),
  }),
  makeDataset({
    id: "ds-004",
    name: "nashik_dairy_2026.csv",
    facility: "Nashik Dairy Facility",
    industry: "food",
    uploadedBy: "sustainability@dairy.in",
    sizeKb: 96,
    rows: makeRows(41, 0.55),
  }),
  makeDataset({
    id: "ds-005",
    name: "gulbarga_cement_kiln.xlsx",
    facility: "Gulbarga Cement Kiln 2",
    industry: "cement",
    uploadedBy: "kiln.ops@cementco.in",
    sizeKb: 402,
    rows: makeRows(57, 2.1),
    status: "archived",
  }),
  makeDataset({
    id: "ds-006",
    name: "hosur_general_mfg.csv",
    facility: "Hosur Fabrication Shed",
    industry: "general",
    uploadedBy: "maint@hosurmfg.in",
    sizeKb: 121,
    rows: makeRows(63, 0.7),
  }),
];

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  severity: "info" | "warning" | "critical";
}

export const AUDIT_LOG: AuditEntry[] = [
  { id: "a1", actor: "admin@carbonengine.io", action: "Dataset deleted", target: "surat_dyeing_2025.csv", at: "2026-09-18 09:41", severity: "critical" },
  { id: "a2", actor: "operations@factory.in", action: "Dataset uploaded", target: "coimbatore_plant1_2026.csv", at: "2026-09-18 08:12", severity: "info" },
  { id: "a3", actor: "esg@chemcorp.in", action: "Column mapping updated", target: "dahej_chem_block_b.csv", at: "2026-09-17 17:55", severity: "info" },
  { id: "a4", actor: "admin@carbonengine.io", action: "Grid emission factor changed", target: "0.72 → 0.71 tCO2e/MWh", at: "2026-09-17 11:03", severity: "warning" },
  { id: "a5", actor: "plant.head@autoworks.in", action: "Optimisation run", target: "Target 25% / ₹8 Cr budget", at: "2026-09-16 15:20", severity: "info" },
  { id: "a6", actor: "sustainability@dairy.in", action: "Report exported", target: "Executive Summary Q3", at: "2026-09-16 10:47", severity: "info" },
];
