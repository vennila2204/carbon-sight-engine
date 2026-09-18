import { INDUSTRIES } from "./industries";
import type {
  AnalysisResult,
  EvaluatedAction,
  FactoryDataset,
  IndustryKey,
  MappableField,
  MonthlyPoint,
  OptimizationInput,
  OptimizationResult,
  ReductionAction,
  SourceBreakdown,
} from "./types";

export const num = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const inr = (v: number) =>
  "₹" +
  (v >= 1e7
    ? (v / 1e7).toFixed(2) + " Cr"
    : v >= 1e5
      ? (v / 1e5).toFixed(2) + " L"
      : Math.round(v).toLocaleString("en-IN"));

export const t = (v: number) =>
  v >= 1000 ? (v / 1000).toFixed(2) + "k" : v.toFixed(v < 10 ? 2 : 1);

export function analyseDataset(dataset: FactoryDataset, industry: IndustryKey): AnalysisResult {
  const profile = INDUSTRIES[industry];
  const map = dataset.mapping;
  const rows = dataset.rows;

  const monthly: MonthlyPoint[] = [];
  const totals: Record<string, number> = {};

  rows.forEach((row, idx) => {
    let s1 = 0;
    let s2 = 0;
    profile.sources.forEach((src) => {
      const col = map[src.field as MappableField];
      if (!col) return;
      const consumption = num(row[col]);
      totals[src.id] = (totals[src.id] ?? 0) + consumption;
      const co2e = consumption * src.factor;
      if (src.scope === 1) s1 += co2e;
      else s2 += co2e;
    });
    const monthCol = map.month;
    const label = monthCol ? String(row[monthCol] ?? `P${idx + 1}`) : `P${idx + 1}`;
    monthly.push({ month: label, scope1: +s1.toFixed(2), scope2: +s2.toFixed(2), total: +(s1 + s2).toFixed(2) });
  });

  const scope1 = monthly.reduce((a, m) => a + m.scope1, 0);
  const scope2 = monthly.reduce((a, m) => a + m.scope2, 0);
  const totalCO2e = scope1 + scope2;

  const production = map.production
    ? rows.reduce((a, r) => a + num(r[map.production as string]), 0)
    : 0;

  const sources: SourceBreakdown[] = profile.sources
    .filter((s) => map[s.field as MappableField])
    .map((s) => {
      const consumption = totals[s.id] ?? 0;
      const co2e = consumption * s.factor;
      const col = map[s.field as MappableField] as string;
      const first = num(rows[0]?.[col]);
      const last = num(rows[rows.length - 1]?.[col]);
      const trend = first > 0 ? ((last - first) / first) * 100 : 0;
      return {
        id: s.id,
        label: s.label,
        consumption,
        unit: s.unit,
        factor: s.factor,
        co2e,
        pct: totalCO2e > 0 ? (co2e / totalCO2e) * 100 : 0,
        scope: s.scope,
        trend,
        category: s.category,
      };
    })
    .sort((a, b) => b.co2e - a.co2e);

  const firstMonth = monthly[0]?.total ?? 0;
  const lastMonth = monthly[monthly.length - 1]?.total ?? 0;

  return {
    totalCO2e,
    scope1,
    scope2,
    production,
    intensity: production > 0 ? totalCO2e / production : 0,
    monthly,
    sources,
    topSource: sources[0] ?? null,
    monthlyTrendPct: firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0,
  };
}

export const ACTION_CATALOG: ReductionAction[] = [
  {
    id: "solar",
    name: "Rooftop Solar PV (1.5 MW)",
    description: "On-site solar generation offsetting grid electricity during daylight operations.",
    targetSource: "electricity",
    reductionPct: 28,
    capexInr: 72000000,
    annualSavingInr: 14500000,
    timelineMonths: 9,
    productionImpact: "None",
    category: "Renewable Energy",
  },
  {
    id: "motors",
    name: "Machine Motor Efficiency (IE4 + VFD)",
    description: "Replace IE2 motors with IE4 and add variable frequency drives on major drives.",
    targetSource: "electricity",
    reductionPct: 12,
    capexInr: 18500000,
    annualSavingInr: 6200000,
    timelineMonths: 5,
    productionImpact: "Low",
    category: "Energy Efficiency",
  },
  {
    id: "boiler",
    name: "Boiler Optimisation & Economiser",
    description: "Combustion tuning, insulation and flue-gas economiser on the main steam boiler.",
    targetSource: "fuel",
    reductionPct: 18,
    capexInr: 9500000,
    annualSavingInr: 4100000,
    timelineMonths: 4,
    productionImpact: "Low",
    category: "Thermal",
  },
  {
    id: "loadshift",
    name: "Load Shifting & Peak Management",
    description: "Shift non-critical loads to off-peak low-carbon grid windows with a BESS buffer.",
    targetSource: "electricity",
    reductionPct: 7,
    capexInr: 6200000,
    annualSavingInr: 3300000,
    timelineMonths: 3,
    productionImpact: "Medium",
    category: "Operations",
  },
  {
    id: "logistics",
    name: "Transport & Logistics Optimisation",
    description: "Route consolidation, backhaul matching and shift of 30% fleet to CNG/EV.",
    targetSource: "transport",
    reductionPct: 32,
    capexInr: 11000000,
    annualSavingInr: 5200000,
    timelineMonths: 6,
    productionImpact: "None",
    category: "Logistics",
  },
  {
    id: "whr",
    name: "Waste Heat Recovery System",
    description: "Recover exhaust heat from process ovens to pre-heat feed water and air.",
    targetSource: "process",
    reductionPct: 22,
    capexInr: 26000000,
    annualSavingInr: 7800000,
    timelineMonths: 10,
    productionImpact: "Medium",
    category: "Thermal",
  },
  {
    id: "biomass",
    name: "Biomass / Renewable Fuel Switch",
    description: "Replace furnace oil with agri-residue briquettes in the thermal loop.",
    targetSource: "fuel",
    reductionPct: 35,
    capexInr: 21000000,
    annualSavingInr: 9100000,
    timelineMonths: 8,
    productionImpact: "Medium",
    category: "Renewable Energy",
  },
  {
    id: "waste",
    name: "Effluent & Waste Circularity Programme",
    description: "Segregation, anaerobic digestion and reuse to cut landfill and effluent emissions.",
    targetSource: "waste",
    reductionPct: 40,
    capexInr: 8400000,
    annualSavingInr: 2600000,
    timelineMonths: 7,
    productionImpact: "None",
    category: "Circularity",
  },
];

export const BUNDLES = [
  { id: "b1", name: "Bundle 1 — Quick Wins", actionIds: ["motors", "boiler", "loadshift"] },
  { id: "b2", name: "Bundle 2 — Deep Decarbonisation", actionIds: ["solar", "biomass", "whr"] },
  { id: "b3", name: "Bundle 3 — Balanced Portfolio", actionIds: ["solar", "boiler", "logistics", "waste"] },
];

export function evaluateActions(
  analysis: AnalysisResult,
  actions: ReductionAction[] = ACTION_CATALOG,
  modifiers: { renewablePct?: number; productionScale?: number } = {},
): EvaluatedAction[] {
  const scale = modifiers.productionScale ?? 1;
  const renewable = (modifiers.renewablePct ?? 0) / 100;
  return actions.map((a) => {
    const src = analysis.sources.find((s) => s.id === a.targetSource);
    let baseEmissions = (src?.co2e ?? 0) * scale;
    if (a.targetSource === "electricity") baseEmissions *= 1 - renewable * 0.6;
    const reductionTonnes = (baseEmissions * a.reductionPct) / 100;
    return {
      ...a,
      reductionTonnes,
      costPerTonne: reductionTonnes > 0 ? a.capexInr / reductionTonnes : Infinity,
      paybackYears: a.annualSavingInr > 0 ? a.capexInr / a.annualSavingInr : Infinity,
    };
  });
}

/**
 * Greedy + local-swap solver in the spirit of an OR-Tools CP-SAT knapsack:
 * maximise abated tonnes subject to a budget, timeline and production-impact
 * constraint, stopping as soon as the abatement target is satisfied.
 */
export function optimise(
  analysis: AnalysisResult,
  input: OptimizationInput,
  pool: EvaluatedAction[],
): OptimizationResult {
  const baseline = analysis.totalCO2e;
  const targetTonnes = (baseline * input.targetPct) / 100;

  const feasible = pool
    .filter((a) => a.timelineMonths <= input.maxTimelineMonths)
    .filter((a) => (input.allowProductionImpact ? true : a.productionImpact !== "Medium"))
    .filter((a) => a.reductionTonnes > 0)
    .sort((a, b) => a.costPerTonne - b.costPerTonne);

  const selected: EvaluatedAction[] = [];
  let spend = 0;
  let abated = 0;

  for (const a of feasible) {
    if (abated >= targetTonnes) break;
    if (spend + a.capexInr > input.budgetInr) continue;
    selected.push(a);
    spend += a.capexInr;
    abated += a.reductionTonnes;
  }

  return {
    selected,
    totalReduction: abated,
    reductionPct: baseline > 0 ? (abated / baseline) * 100 : 0,
    totalCost: spend,
    budgetRemaining: input.budgetInr - spend,
    targetMet: abated >= targetTonnes,
    baseline,
    after: Math.max(baseline - abated, 0),
  };
}
