export const REGIONS = [
  "TX",
  "VA",
  "AZ",
  "GA",
  "OH",
  "Carolinas",
  "Other",
] as const;

export const PROJECT_TYPES = [
  "hyperscale",
  "colo",
  "AI/HPC",
  "enterprise",
  "expansion",
  "power-for-DC",
  "unknown",
] as const;

export const RECORD_KINDS = ["live", "example"] as const;

export const CONFIDENCE = ["confirmed", "inferred", "unknown"] as const;

export const SCORE_BANDS = [
  "pursuit_now",
  "develop",
  "monitor",
  "intel_only",
] as const;

export const STATUSES = [
  "keep_warm",
  "active_pursuit",
  "watching",
  "awarded",
  "lost",
  "on_hold",
  "unknown",
] as const;

export const CX_AWARD_STATUSES = [
  "open",
  "pending",
  "competitor_locked",
  "dqcx_awarded",
  "unknown",
] as const;

export const RELATIONSHIPS = [
  "existing",
  "prior",
  "none",
  "unknown",
] as const;

export const LIKELIHOODS = ["high", "medium", "low", "unknown"] as const;

export const SOURCE_TYPES = [
  "primary",
  "internal",
  "secondary",
  "rumor",
  "example",
] as const;

export const SCOPE_KEYS = [
  "L0",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "L6",
  "IST",
  "scripts",
  "FAT",
  "TAB",
  "QAQC",
] as const;

export const DATE_KEYS = [
  "announcement",
  "sitework",
  "shell",
  "permanent_power",
  "L0",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "L6",
  "IST",
  "RFS",
  "dqcx_pursuit_window_start",
  "dqcx_pursuit_window_end",
  "cx_award_target",
] as const;

export type Region = (typeof REGIONS)[number];
export type ProjectType = (typeof PROJECT_TYPES)[number];
export type RecordKind = (typeof RECORD_KINDS)[number];
export type Confidence = (typeof CONFIDENCE)[number];
export type ScoreBand = (typeof SCORE_BANDS)[number];
export type Status = (typeof STATUSES)[number];
export type CxAwardStatus = (typeof CX_AWARD_STATUSES)[number];
export type Relationship = (typeof RELATIONSHIPS)[number];
export type Likelihood = (typeof LIKELIHOODS)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type ScopeKey = (typeof SCOPE_KEYS)[number];
export type DateKey = (typeof DATE_KEYS)[number];

export type Source = {
  url: string;
  type: SourceType;
  date: string;
  quote: string;
};

export type ProjectDates = Record<DateKey, string | null>;

export type ScopeFit = Record<ScopeKey, Likelihood>;

export type ScoreComponent = {
  key: string;
  label: string;
  weight: number;
  points: number;
  reason: string;
};

export type ScoreAdjustment = {
  label: string;
  points: number;
};

export type ScoreBreakdown = {
  components: ScoreComponent[];
  adjustments: ScoreAdjustment[];
  cap: string | null;
  raw: number;
  score: number;
  band: ScoreBand;
  rationale: string;
};

export type FieldConfidence = Record<string, Confidence>;

export type Project = {
  project_id: string;
  name: string;
  aliases: string[];
  campus: string | null;
  building: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  region: Region;
  dq_number: string | null;
  record_kind: RecordKind;

  project_type: ProjectType;
  it_mw: number | null;
  critical_mw: number | null;
  buildings: number | null;
  high_density: boolean | null;
  liquid_cool: boolean | null;
  value_usd: number | null;
  status: Status;

  owner: string | null;
  developer: string | null;
  tenant: string | null;
  gc: string | null;
  mep: string | null;
  utility: string | null;
  cxa_incumbent: string | null;
  tab: string | null;
  electrical_contractor: string | null;
  mechanical_contractor: string | null;
  oem_vendors: string[];
  bd_owner_internal: string | null;
  cx_award_status: CxAwardStatus;
  relationship: Relationship;

  dates: ProjectDates;
  scope_fit: ScopeFit;

  opportunity_score: number;
  score_band: ScoreBand;
  score_rationale: string;
  score_breakdown: ScoreBreakdown;
  next_action: string;
  next_action_due: string | null;

  sources: Source[];
  field_confidence: FieldConfidence;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = Omit<
  Project,
  | "opportunity_score"
  | "score_band"
  | "score_rationale"
  | "score_breakdown"
  | "created_at"
  | "updated_at"
> & {
  project_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProjectFilters = {
  region?: Region | "";
  band?: ScoreBand | "";
  status?: Status | "";
  project_type?: ProjectType | "";
  q?: string;
};

export const SCORE_WEIGHTS = {
  mw: 20,
  scheduleFit: 25,
  geo: 15,
  ownerGcKnown: 10,
  cxAward: 10,
  existingRelationship: 10,
  revenue: 5,
  sourceQuality: 5,
} as const;

export const COMPETITOR_LOCKED_PENALTY = 15;

export const DATE_LABELS: Record<DateKey, string> = {
  announcement: "Announcement",
  sitework: "Sitework",
  shell: "Shell",
  permanent_power: "Permanent power",
  L0: "L0",
  L1: "L1",
  L2: "L2",
  L3: "L3",
  L4: "L4",
  L5: "L5",
  L6: "L6",
  IST: "IST",
  RFS: "RFS",
  dqcx_pursuit_window_start: "Pursuit window start",
  dqcx_pursuit_window_end: "Pursuit window end",
  cx_award_target: "Cx award target",
};

export const SCOPE_LABELS: Record<ScopeKey, string> = {
  L0: "L0",
  L1: "L1",
  L2: "L2",
  L3: "L3",
  L4: "L4",
  L5: "L5",
  L6: "L6",
  IST: "IST",
  scripts: "Scripts",
  FAT: "FAT",
  TAB: "TAB",
  QAQC: "QA/QC",
};

export const BAND_LABELS: Record<ScoreBand, string> = {
  pursuit_now: "Pursuit now",
  develop: "Develop",
  monitor: "Monitor",
  intel_only: "Intel only",
};

export const BAND_RANGES: Record<ScoreBand, string> = {
  pursuit_now: "90–100",
  develop: "75–89",
  monitor: "50–74",
  intel_only: "<50",
};

export const STATUS_LABELS: Record<Status, string> = {
  keep_warm: "Keep warm",
  active_pursuit: "Active pursuit",
  watching: "Watching",
  awarded: "Awarded",
  lost: "Lost",
  on_hold: "On hold",
  unknown: "Unknown",
};

export const IMPORTANT_NEED_FIELDS = [
  { key: "it_mw", label: "IT MW" },
  { key: "dates.L3", label: "L3 date" },
  { key: "owner", label: "Owner" },
  { key: "gc", label: "GC" },
  { key: "cxa_incumbent", label: "CxA incumbent" },
  { key: "utility", label: "Utility" },
  { key: "tab", label: "TAB" },
  { key: "value_usd", label: "Sourced $" },
  { key: "sources", label: "Primary source" },
] as const;
