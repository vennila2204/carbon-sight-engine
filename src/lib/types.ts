export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  facility: string;
}

export type IndustryKey =
  | "textile"
  | "automotive"
  | "chemical"
  | "food"
  | "cement"
  | "general";

export interface IndustryProfile {
  key: IndustryKey;
  label: string;
  unit: string;
  gridFactor: number; // tCO2e per kWh
  sources: EmissionSourceDef[];
  benchmarkIntensity: number;
}

export type Scope = 1 | 2;

export interface EmissionSourceDef {
  id: string;
  label: string;
  unit: string;
  factor: number; // tCO2e per unit
  scope: Scope;
  field: MappableField;
  category: "energy" | "fuel" | "process" | "logistics" | "waste";
}

export type MappableField =
  | "month"
  | "electricity"
  | "fuel"
  | "production"
  | "transport"
  | "waste"
  | "process";

export type ColumnMapping = Partial<Record<MappableField, string>>;

export type DatasetRow = Record<string, string | number>;

export interface FactoryDataset {
  id: string;
  name: string;
  facility: string;
  industry: IndustryKey;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
  rows: DatasetRow[];
  columns: string[];
  mapping: ColumnMapping;
  status: "active" | "archived";
}

export interface ParsedFile {
  fileName: string;
  sizeKb: number;
  columns: string[];
  rows: DatasetRow[];
  rowCount: number;
  missingValues: number;
}

export interface SourceBreakdown {
  id: string;
  label: string;
  consumption: number;
  unit: string;
  factor: number;
  co2e: number;
  pct: number;
  scope: Scope;
  trend: number; // percent change vs first month
  category: EmissionSourceDef["category"];
}

export interface MonthlyPoint {
  month: string;
  scope1: number;
  scope2: number;
  total: number;
}

export interface AnalysisResult {
  totalCO2e: number;
  scope1: number;
  scope2: number;
  production: number;
  intensity: number;
  monthly: MonthlyPoint[];
  sources: SourceBreakdown[];
  topSource: SourceBreakdown | null;
  monthlyTrendPct: number;
}

export interface ReductionAction {
  id: string;
  name: string;
  description: string;
  targetSource: MappableField;
  reductionPct: number; // of the target source emissions
  capexInr: number;
  annualSavingInr: number;
  timelineMonths: number;
  productionImpact: "None" | "Low" | "Medium";
  category: string;
}

export interface EvaluatedAction extends ReductionAction {
  reductionTonnes: number;
  costPerTonne: number;
  paybackYears: number;
}

export interface Bundle {
  id: string;
  name: string;
  actionIds: string[];
}

export interface OptimizationInput {
  targetPct: number;
  budgetInr: number;
  maxTimelineMonths: number;
  allowProductionImpact: boolean;
}

export interface OptimizationResult {
  selected: EvaluatedAction[];
  totalReduction: number;
  reductionPct: number;
  totalCost: number;
  budgetRemaining: number;
  targetMet: boolean;
  baseline: number;
  after: number;
}
