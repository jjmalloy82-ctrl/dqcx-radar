import type {
  Confidence,
  CxAwardStatus,
  Likelihood,
  Project,
  ProjectDates,
  ProjectInput,
  Relationship,
  ScopeFit,
  Source,
  SourceType,
  Status,
} from "./types";
import {
  CX_AWARD_STATUSES,
  PROJECT_TYPES,
  RECORD_KINDS,
  REGIONS,
  SCORE_BANDS,
  SOURCE_TYPES,
} from "./types";
import { applyScoring, emptyDates, emptyScopeFit } from "./scoring";

/** Live listen-pack dump (flattened dates, free-text status, extra source types). */
export type LiveBoardFile = {
  version?: string;
  product?: string;
  updated?: string;
  seed_version?: string;
  projects?: unknown[];
};

type LiveSource = {
  url?: string | null;
  type?: string | null;
  date?: string | null;
  quote?: string | null;
  label?: string | null;
  accessed?: string | null;
};

const PRIMARY_SOURCE_TYPES = new Set([
  "primary",
  "owner_pr",
  "owner_site",
  "permit",
  "permit_filing",
  "sec_filing",
  "utility_pr",
  "utility",
  "gov_pr",
  "filing",
  "planning_board",
  "owner_local_gov",
  "press_release",
]);

const INTERNAL_SOURCE_TYPES = new Set(["internal", "internal_hunt"]);

function blank(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^unknown$/i.test(s)) return null;
  return s;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  const s = String(value ?? "");
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

function confidenceValue(value: unknown): Confidence {
  if (value === "confirmed" || value === "inferred" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function mapSourceType(raw: string | null | undefined, url: string): SourceType {
  const t = (raw ?? "").trim().toLowerCase();
  if ((SOURCE_TYPES as readonly string[]).includes(t)) return t as SourceType;
  if (PRIMARY_SOURCE_TYPES.has(t)) return "primary";
  if (INTERNAL_SOURCE_TYPES.has(t)) return "internal";
  if (t === "rumor") return "rumor";
  if (t === "example") return "example";
  if (!t && /tdlr\.texas\.gov/i.test(url)) return "primary";
  if (!t && url) return "secondary";
  return "secondary";
}

function mapSources(value: unknown): Source[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const s = (raw ?? {}) as LiveSource;
    const url = blank(s.url) ?? "";
    const quote = blank(s.quote) ?? blank(s.label) ?? "";
    const date = blank(s.date) ?? blank(s.accessed) ?? "";
    return {
      url,
      type: mapSourceType(s.type, url),
      date,
      quote,
    };
  });
}

function mapLikelihood(value: unknown): Likelihood {
  const s = String(value ?? "unknown").toLowerCase();
  if (s === "high" || s === "medium" || s === "low" || s === "unknown") return s;
  if (s === "likely" || s === "probable") return "medium";
  if (s === "unlikely") return "low";
  return "unknown";
}

function mapScope(row: Record<string, unknown>): ScopeFit {
  const scope = emptyScopeFit();
  const pairs: [keyof ScopeFit, unknown][] = [
    ["L0", row.scope_l0],
    ["L1", row.scope_l1_fat ?? row.scope_l1],
    ["L2", row.scope_l2],
    ["L3", row.scope_l3],
    ["L4", row.scope_l4],
    ["L5", row.scope_l5_ist ?? row.scope_l5],
    ["L6", row.scope_l6],
    ["IST", row.scope_ist ?? row.scope_l5_ist],
    ["scripts", row.scope_scripts],
    ["FAT", row.scope_fat ?? row.scope_l1_fat],
    ["TAB", row.scope_tab_oversight ?? row.scope_tab],
    ["QAQC", row.scope_qaqc],
  ];
  for (const [key, value] of pairs) {
    if (value != null) scope[key] = mapLikelihood(value);
  }
  return scope;
}

function mapDates(row: Record<string, unknown>): ProjectDates {
  const dates = emptyDates();
  dates.announcement = blank(row.announcement_date);
  dates.sitework = blank(row.sitework_date);
  dates.shell = blank(row.shell_date);
  dates.permanent_power = blank(row.permanent_power_date);
  dates.L0 = blank(row.l0_date);
  dates.L1 = blank(row.l1_date);
  dates.L2 = blank(row.l2_date);
  dates.L3 = blank(row.l3_date);
  dates.L4 = blank(row.l4_date);
  dates.L5 = blank(row.l5_date);
  dates.L6 = blank(row.l6_date);
  dates.IST = blank(row.ist_date);
  dates.RFS = blank(row.rfs_cod_date);
  dates.dqcx_pursuit_window_start = blank(row.pursuit_window_start);
  dates.dqcx_pursuit_window_end = blank(row.pursuit_window_end);
  dates.cx_award_target = blank(row.cx_award_target);
  return dates;
}

function mapStatus(raw: unknown, flags: string[]): Status {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("keep warm") || s.includes("open sor")) return "keep_warm";
  if (s.includes("unlock held") || flags.includes("unlock_held")) return "on_hold";
  if (s.includes("on hold")) return "on_hold";
  if (s === "awarded" || s === "lost") return s;
  return "watching";
}

function mapRelationship(flags: string[], bdOwner: string | null): Relationship {
  if (flags.includes("warm_sor") || flags.includes("open_sor") || flags.includes("field_live")) {
    return "existing";
  }
  if (flags.includes("powerhouse_prior_touch")) return "prior";
  if (bdOwner) return "existing";
  return "unknown";
}

function mapCxAward(rawStatus: string, blockers: string[]): CxAwardStatus {
  const s = rawStatus.toLowerCase();
  if (blockers.includes("not_awarded") || s.includes("award pending")) return "pending";
  if (s.includes("cx not awarded") || s.includes("cxa still open") || s.includes("cx award open")) {
    return "open";
  }
  if (CX_AWARD_STATUSES.includes(s as CxAwardStatus)) return s as CxAwardStatus;
  return "unknown";
}

function mapNotes(row: Record<string, unknown>): string | null {
  const chunks: string[] = [];
  const status = blank(row.status);
  if (status) chunks.push(`Listen status: ${status}`);
  const estimated = blank(row.estimated_entry);
  if (estimated) chunks.push(`Estimated entry: ${estimated}`);
  const award = blank(row.award_timing_note);
  if (award) chunks.push(`Award timing: ${award}`);
  const template = blank(row.template_notice);
  if (template) chunks.push(template);
  const internal = blank(row.notes_internal);
  if (internal) chunks.push(internal);
  const blockers = asStringArray(row.blockers);
  if (blockers.length) chunks.push(`Blockers: ${blockers.join(", ")}`);
  const flags = asStringArray(row.relationship_flags);
  if (flags.length) chunks.push(`Flags: ${flags.join(", ")}`);
  return chunks.length ? chunks.join("\n\n") : null;
}

function mapConfidence(row: Record<string, unknown>): ProjectInput["field_confidence"] {
  const raw = (row.confidence ?? row.field_confidence ?? {}) as Record<string, unknown>;
  const out: ProjectInput["field_confidence"] = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = confidenceValue(value);
  }
  if (out.density_flag && !out.high_density) out.high_density = out.density_flag;
  if (out.liquid_cool_flag && !out.liquid_cool) out.liquid_cool = out.liquid_cool_flag;
  if (out.l3_date && !out["dates.L3"]) out["dates.L3"] = out.l3_date;
  if (out.bd_owner && !out.bd_owner_internal) out.bd_owner_internal = out.bd_owner;
  return out;
}

function alreadyAppShape(row: Record<string, unknown>): boolean {
  return Boolean(row.dates && typeof row.dates === "object" && row.scope_fit && typeof row.scope_fit === "object");
}

export function normalizeLiveRecord(raw: unknown): ProjectInput {
  const row = (raw ?? {}) as Record<string, unknown>;
  if (alreadyAppShape(row) && !("l3_date" in row) && !("density_flag" in row)) {
    const copy = { ...row };
    delete copy.opportunity_score;
    delete copy.score_band;
    delete copy.score_rationale;
    delete copy.score_breakdown;
    return copy as unknown as ProjectInput;
  }

  const flags = asStringArray(row.relationship_flags);
  const blockers = asStringArray(row.blockers);
  const rawStatus = String(row.status ?? "");
  const bdOwner = blank(row.bd_owner_internal) ?? blank(row.bd_owner);

  return {
    project_id: blank(row.project_id) ?? "",
    name: String(row.name ?? "").trim() || "Untitled",
    aliases: asStringArray(row.aliases),
    campus: blank(row.campus),
    building: blank(row.building),
    city: blank(row.city),
    state: blank(row.state),
    country: blank(row.country) ?? "US",
    region: oneOf(row.region, REGIONS, "Other"),
    dq_number: blank(row.dq_number),
    record_kind: oneOf(row.record_kind, RECORD_KINDS, "live"),
    project_type: oneOf(row.project_type, PROJECT_TYPES, "unknown"),
    it_mw: asNumber(row.it_mw),
    critical_mw: asNumber(row.critical_mw),
    buildings: asNumber(row.buildings),
    high_density:
      typeof row.high_density === "boolean"
        ? row.high_density
        : typeof row.density_flag === "boolean"
          ? row.density_flag
          : null,
    liquid_cool:
      typeof row.liquid_cool === "boolean"
        ? row.liquid_cool
        : typeof row.liquid_cool_flag === "boolean"
          ? row.liquid_cool_flag
          : null,
    value_usd: asNumber(row.value_usd),
    status: mapStatus(rawStatus, flags),
    owner: blank(row.owner),
    developer: blank(row.developer),
    tenant: blank(row.tenant),
    gc: blank(row.gc),
    mep: blank(row.mep),
    utility: blank(row.utility),
    cxa_incumbent: blank(row.cxa_incumbent),
    tab: blank(row.tab),
    electrical_contractor: blank(row.electrical_contractor),
    mechanical_contractor: blank(row.mechanical_contractor),
    oem_vendors: asStringArray(row.oem_vendors),
    bd_owner_internal: bdOwner,
    cx_award_status: mapCxAward(rawStatus, blockers),
    relationship: mapRelationship(flags, bdOwner),
    dates: mapDates(row),
    scope_fit: mapScope(row),
    next_action: blank(row.next_action) ?? "",
    next_action_due: blank(row.next_action_due),
    sources: mapSources(row.sources),
    field_confidence: mapConfidence(row),
    notes: mapNotes(row),
  };
}

export function applyListenScore(
  scored: Project,
  raw: unknown,
): Project {
  const row = (raw ?? {}) as Record<string, unknown>;
  const listenScore = asNumber(row.opportunity_score);
  const listenBand = oneOf(row.score_band, SCORE_BANDS, scored.score_band);
  const listenRationale = blank(row.score_rationale);
  if (listenScore == null) return scored;

  const cap =
    listenScore !== scored.opportunity_score
      ? `Listen board score ${listenScore} (${listenBand}) retained from the 2026-09-18 dump. Function recomputes on edit.`
      : scored.score_breakdown.cap;

  return {
    ...scored,
    opportunity_score: listenScore,
    score_band: listenBand,
    score_rationale: listenRationale ?? scored.score_rationale,
    score_breakdown: {
      ...scored.score_breakdown,
      score: listenScore,
      band: listenBand,
      rationale: listenRationale ?? scored.score_breakdown.rationale,
      cap,
    },
  };
}

export function projectsFromBoard(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const file = data as LiveBoardFile;
  if (Array.isArray(file.projects)) return file.projects;
  throw new Error("data/projects.json has no projects to seed.");
}

export function ingestBoard(data: unknown): Project[] {
  const rows = projectsFromBoard(data);
  if (rows.length === 0) {
    throw new Error("data/projects.json has no projects to seed.");
  }
  return rows.map((row) => applyListenScore(applyScoring(normalizeLiveRecord(row)), row));
}
