import {
  COMPETITOR_LOCKED_PENALTY,
  SCORE_WEIGHTS,
  type Confidence,
  type Project,
  type ProjectDates,
  type ProjectInput,
  type ScoreBand,
  type ScoreBreakdown,
  type ScoreComponent,
  type Source,
} from "./types";

function monthsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.437);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iso = /^\d{4}-\d{2}$/.test(trimmed) ? `${trimmed}-01` : trimmed;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function confidenceOf(project: ProjectInput | Project, key: string): Confidence {
  return project.field_confidence?.[key] ?? "unknown";
}

function isKnownName(value: string | null | undefined, conf: Confidence): boolean {
  return Boolean(value && value.trim()) && conf !== "unknown";
}

function sourcedValueUsd(project: ProjectInput | Project): number | null {
  if (project.value_usd == null || Number.isNaN(project.value_usd)) return null;
  const conf = confidenceOf(project, "value_usd");
  if (conf === "unknown") return null;
  const hasMoneySource = project.sources.some(
    (s) => s.type !== "rumor" && s.quote.trim().length > 0,
  );
  if (!hasMoneySource && conf !== "confirmed") return null;
  if (!hasMoneySource && conf === "confirmed" && project.sources.length === 0) {
    return null;
  }
  return project.value_usd;
}

function isRumorOnly(sources: Source[]): boolean {
  if (sources.length === 0) return true;
  return sources.every((s) => s.type === "rumor");
}

function mwPoints(project: ProjectInput | Project): ScoreComponent {
  const weight = SCORE_WEIGHTS.mw;
  const mw =
    project.it_mw ??
    project.critical_mw ??
    null;
  const conf = project.it_mw != null
    ? confidenceOf(project, "it_mw")
    : confidenceOf(project, "critical_mw");

  if (mw == null || conf === "unknown") {
    return {
      key: "mw",
      label: "MW",
      weight,
      points: 4,
      reason: "IT/critical MW unknown — unknowns reduce points.",
    };
  }

  let points = 8;
  if (mw >= 80) points = 20;
  else if (mw >= 40) points = 18;
  else if (mw >= 15) points = 16;
  else if (mw >= 5) points = 12;
  else points = 8;

  if (conf === "inferred") points = Math.max(4, points - 3);

  return {
    key: "mw",
    label: "MW",
    weight,
    points,
    reason:
      conf === "inferred"
        ? `${mw} MW inferred (haircut vs confirmed).`
        : `${mw} MW confirmed.`,
  };
}

function schedulePoints(
  project: ProjectInput | Project,
  now: Date,
): ScoreComponent {
  const weight = SCORE_WEIGHTS.scheduleFit;
  const l3 = parseDate(project.dates.L3);

  if (l3) {
    const months = monthsBetween(now, l3);
    let points = 5;
    let reason = "";
    if (months >= 6 && months <= 18) {
      points = 25;
      reason = `L3 in ${months.toFixed(1)} months — inside the 6–18 month pursuit window.`;
    } else if (months >= 4 && months < 6) {
      points = 18;
      reason = `L3 in ${months.toFixed(1)} months — slightly late vs ideal window.`;
    } else if (months > 18 && months <= 24) {
      points = 18;
      reason = `L3 in ${months.toFixed(1)} months — slightly early vs ideal window.`;
    } else if (months >= 2 && months < 4) {
      points = 12;
      reason = `L3 in ${months.toFixed(1)} months — compressed runway.`;
    } else if (months > 24 && months <= 30) {
      points = 12;
      reason = `L3 in ${months.toFixed(1)} months — still early.`;
    } else if (months >= 0 && months < 2) {
      points = 8;
      reason = "L3 imminent — limited time to shape Cx award.";
    } else if (months > 30 && months <= 42) {
      points = 10;
      reason = `L3 in ${months.toFixed(1)} months — monitor, too early to staff a pursuit.`;
    } else if (months < 0) {
      points = 4;
      reason = "L3 date is in the past.";
    } else {
      points = 6;
      reason = `L3 in ${months.toFixed(1)} months — far horizon.`;
    }
    return { key: "scheduleFit", label: "Schedule fit", weight, points, reason };
  }

  const winStart = parseDate(project.dates.dqcx_pursuit_window_start);
  const winEnd = parseDate(project.dates.dqcx_pursuit_window_end);
  if (winStart || winEnd) {
    const start = winStart ?? now;
    const end = winEnd ?? new Date(start.getTime() + 90 * 86400000);
    if (now >= start && now <= end) {
      return {
        key: "scheduleFit",
        label: "Schedule fit",
        weight,
        points: 16,
        reason: "Inside an explicit DQCX pursuit window (no L3 date to fine-tune).",
      };
    }
    const daysToStart = (start.getTime() - now.getTime()) / 86400000;
    if (daysToStart > 0 && daysToStart <= 90) {
      return {
        key: "scheduleFit",
        label: "Schedule fit",
        weight,
        points: 14,
        reason: "Pursuit window opens within 90 days. L3 still unknown.",
      };
    }
    if (now > end) {
      return {
        key: "scheduleFit",
        label: "Schedule fit",
        weight,
        points: 6,
        reason: "Pursuit window has closed. L3 still unknown.",
      };
    }
    return {
      key: "scheduleFit",
      label: "Schedule fit",
      weight,
      points: 8,
      reason: "Pursuit window is on the calendar but more than 90 days out.",
    };
  }

  const award = parseDate(project.dates.cx_award_target);
  if (award && (project.cx_award_status === "pending" || project.cx_award_status === "open")) {
    const days = Math.abs((award.getTime() - now.getTime()) / 86400000);
    const points = days <= 90 ? 10 : 8;
    return {
      key: "scheduleFit",
      label: "Schedule fit",
      weight,
      points,
      reason:
        "No L3 date. Using Cx award target as a weak timing signal — not a substitute for COD/L3.",
    };
  }

  return {
    key: "scheduleFit",
    label: "Schedule fit",
    weight,
    points: 5,
    reason: "No L3 / IST / pursuit-window dates — unknowns reduce points.",
  };
}

function geoPoints(project: ProjectInput | Project): ScoreComponent {
  const weight = SCORE_WEIGHTS.geo;
  const conf = confidenceOf(project, "region");
  if (!project.region || (conf === "unknown" && !project.city && !project.state)) {
    if (project.region && project.region !== "Other") {
      // region was chosen explicitly
    } else if (!project.region) {
      return {
        key: "geo",
        label: "Geo",
        weight,
        points: 3,
        reason: "Location unknown.",
      };
    }
  }

  const namedCore = ["VA", "AZ", "GA", "OH", "Carolinas"] as const;
  let points = 6;
  let reason = "Region Other — not a named DQCX core market.";
  if (project.region === "TX") {
    points = 15;
    reason = "Texas — DQCX core geography.";
  } else if (namedCore.includes(project.region as (typeof namedCore)[number])) {
    points = 12;
    reason = `${project.region} is a named Radar region.`;
  } else if (project.country && project.country !== "US" && project.country !== "USA") {
    points = 5;
    reason = `${project.country} — outside named US regions.`;
  }

  if (confidenceOf(project, "region") === "unknown" && project.region === "Other" && !project.state) {
    points = Math.min(points, 6);
  }

  return { key: "geo", label: "Geo", weight, points, reason };
}

function ownerGcPoints(project: ProjectInput | Project): ScoreComponent {
  const weight = SCORE_WEIGHTS.ownerGcKnown;
  const ownerKnown = isKnownName(project.owner, confidenceOf(project, "owner"));
  const gcKnown = isKnownName(project.gc, confidenceOf(project, "gc"));
  const ownerConf = confidenceOf(project, "owner");
  const gcConf = confidenceOf(project, "gc");

  if (ownerKnown && gcKnown && ownerConf === "confirmed" && gcConf === "confirmed") {
    return {
      key: "ownerGcKnown",
      label: "Owner / GC known",
      weight,
      points: 10,
      reason: "Owner and GC both confirmed.",
    };
  }
  if (ownerKnown && gcKnown) {
    return {
      key: "ownerGcKnown",
      label: "Owner / GC known",
      weight,
      points: 8,
      reason: "Owner and GC both identified (at least one inferred).",
    };
  }
  if ((ownerKnown && ownerConf === "confirmed") || (gcKnown && gcConf === "confirmed")) {
    return {
      key: "ownerGcKnown",
      label: "Owner / GC known",
      weight,
      points: 7,
      reason: ownerKnown ? "Owner confirmed; GC missing." : "GC confirmed; owner missing.",
    };
  }
  if (ownerKnown || gcKnown) {
    return {
      key: "ownerGcKnown",
      label: "Owner / GC known",
      weight,
      points: 5,
      reason: "One of owner/GC inferred; the other unknown.",
    };
  }
  return {
    key: "ownerGcKnown",
    label: "Owner / GC known",
    weight,
    points: 2,
    reason: "Owner and GC unknown — unknowns reduce points.",
  };
}

function cxAwardPoints(project: ProjectInput | Project): ScoreComponent {
  const weight = SCORE_WEIGHTS.cxAward;
  switch (project.cx_award_status) {
    case "open":
    case "pending":
      return {
        key: "cxAward",
        label: "Cx award",
        weight,
        points: 10,
        reason:
          project.cx_award_status === "pending"
            ? "Cx award pending — still contestable."
            : "Cx award open.",
      };
    case "dqcx_awarded":
      return {
        key: "cxAward",
        label: "Cx award",
        weight,
        points: 3,
        reason: "Already DQCX — not a new pursuit.",
      };
    case "competitor_locked":
      return {
        key: "cxAward",
        label: "Cx award",
        weight,
        points: 0,
        reason: "Competitor Cx is locked. Penalty applied separately.",
      };
    default:
      return {
        key: "cxAward",
        label: "Cx award",
        weight,
        points: 4,
        reason: "Cx award status unknown.",
      };
  }
}

function relationshipPoints(project: ProjectInput | Project): ScoreComponent {
  const weight = SCORE_WEIGHTS.existingRelationship;
  switch (project.relationship) {
    case "existing":
      return {
        key: "existingRelationship",
        label: "Existing relationship",
        weight,
        points: 10,
        reason: "Active internal relationship (BD owner assigned / keep-warm).",
      };
    case "prior":
      return {
        key: "existingRelationship",
        label: "Existing relationship",
        weight,
        points: 7,
        reason: "Prior relationship — not current coverage.",
      };
    case "none":
      return {
        key: "existingRelationship",
        label: "Existing relationship",
        weight,
        points: 3,
        reason: "No known relationship.",
      };
    default:
      return {
        key: "existingRelationship",
        label: "Existing relationship",
        weight,
        points: 2,
        reason: "Relationship unknown.",
      };
  }
}

function revenuePoints(project: ProjectInput | Project): ScoreComponent {
  const weight = SCORE_WEIGHTS.revenue;
  const value = sourcedValueUsd(project);
  if (value == null) {
    return {
      key: "revenue",
      label: "Revenue",
      weight,
      points: 0,
      reason: "No sourced dollar figure. Radar never invents revenue.",
    };
  }
  let points = 2;
  if (value >= 1_000_000) points = 5;
  else if (value >= 250_000) points = 4;
  else if (value >= 50_000) points = 3;
  return {
    key: "revenue",
    label: "Revenue",
    weight,
    points,
    reason: `Sourced value_usd $${value.toLocaleString("en-US")}.`,
  };
}

function sourceQualityPoints(project: ProjectInput | Project): ScoreComponent {
  const weight = SCORE_WEIGHTS.sourceQuality;
  const sources = project.sources ?? [];
  if (sources.length === 0) {
    return {
      key: "sourceQuality",
      label: "Source quality",
      weight,
      points: 0,
      reason: "No sources on file.",
    };
  }
  if (sources.some((s) => s.type === "primary")) {
    return {
      key: "sourceQuality",
      label: "Source quality",
      weight,
      points: 5,
      reason: "At least one primary source (permit / utility / owner / official).",
    };
  }
  if (sources.some((s) => s.type === "internal")) {
    return {
      key: "sourceQuality",
      label: "Source quality",
      weight,
      points: 4,
      reason: "Internal DQ record — usable, not a primary site source.",
    };
  }
  if (sources.some((s) => s.type === "example")) {
    return {
      key: "sourceQuality",
      label: "Source quality",
      weight,
      points: 5,
      reason: "Example record uses labeled example sources.",
    };
  }
  if (sources.some((s) => s.type === "secondary")) {
    return {
      key: "sourceQuality",
      label: "Source quality",
      weight,
      points: 3,
      reason: "Secondary / press only.",
    };
  }
  return {
    key: "sourceQuality",
    label: "Source quality",
    weight,
    points: 1,
    reason: "Rumor-class sources only.",
  };
}

export function bandForScore(score: number): ScoreBand {
  if (score >= 90) return "pursuit_now";
  if (score >= 75) return "develop";
  if (score >= 50) return "monitor";
  return "intel_only";
}

export function scoreProject(
  project: ProjectInput | Project,
  now = new Date(),
): ScoreBreakdown {
  const components = [
    mwPoints(project),
    schedulePoints(project, now),
    geoPoints(project),
    ownerGcPoints(project),
    cxAwardPoints(project),
    relationshipPoints(project),
    revenuePoints(project),
    sourceQualityPoints(project),
  ];

  const raw = components.reduce((sum, c) => sum + c.points, 0);
  const adjustments: ScoreBreakdown["adjustments"] = [];

  if (project.cx_award_status === "competitor_locked") {
    adjustments.push({
      label: "Competitor Cx locked",
      points: -COMPETITOR_LOCKED_PENALTY,
    });
  }

  let score = raw + adjustments.reduce((sum, a) => sum + a.points, 0);
  score = Math.max(0, Math.min(100, score));

  let cap: string | null = null;
  if (isRumorOnly(project.sources ?? [])) {
    if (score >= 50) {
      cap = "Rumor-only intelligence is capped at intel_only (<50).";
    } else {
      cap = "Rumor-only / unsourced record — cannot leave intel_only until a primary source exists.";
    }
    score = Math.min(score, 49);
  }

  const band = bandForScore(score);
  const rationale = buildRationale(project, components, adjustments, cap, score, band);

  return { components, adjustments, cap, raw, score, band, rationale };
}

function buildRationale(
  project: ProjectInput | Project,
  components: ScoreComponent[],
  adjustments: ScoreBreakdown["adjustments"],
  cap: string | null,
  score: number,
  band: ScoreBand,
): string {
  const top = [...components]
    .sort((a, b) => b.points / b.weight - a.points / a.weight)
    .slice(0, 3)
    .map((c) => c.reason);
  const weak = components
    .filter((c) => c.points <= c.weight * 0.35)
    .map((c) => c.label);
  const adj = adjustments.map((a) => `${a.label} (${a.points})`);
  const parts = [
    `${project.name || "Untitled"} scores ${score} (${band.replace("_", " ")}).`,
    ...top,
  ];
  if (weak.length) parts.push(`Soft factors: ${weak.join(", ")}.`);
  if (adj.length) parts.push(`Adjustments: ${adj.join("; ")}.`);
  if (cap) parts.push(cap);
  return parts.join(" ");
}

export function emptyDates(): ProjectDates {
  return {
    announcement: null,
    sitework: null,
    shell: null,
    permanent_power: null,
    L0: null,
    L1: null,
    L2: null,
    L3: null,
    L4: null,
    L5: null,
    L6: null,
    IST: null,
    RFS: null,
    dqcx_pursuit_window_start: null,
    dqcx_pursuit_window_end: null,
    cx_award_target: null,
  };
}

export function emptyScopeFit(): Project["scope_fit"] {
  return {
    L0: "unknown",
    L1: "unknown",
    L2: "unknown",
    L3: "unknown",
    L4: "unknown",
    L5: "unknown",
    L6: "unknown",
    IST: "unknown",
    scripts: "unknown",
    FAT: "unknown",
    TAB: "unknown",
    QAQC: "unknown",
  };
}

export function suggestNextAction(project: ProjectInput | Project, band: ScoreBand): string {
  if (project.next_action && project.next_action.trim()) return project.next_action.trim();
  if (band === "intel_only") return "Enrich from primary source";
  if (band === "monitor") return "Keep warm — confirm L3 / award timing from a primary source before staffing.";
  if (band === "develop") return "Open a pursuit thread: confirm Cx spec, IST matrix, and award date.";
  return "Call this week — window is open. Confirm scope (L3–L6 / IST) and decision-maker.";
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function derivePursuitWindow(dates: ProjectDates): ProjectDates {
  const next = { ...dates };
  if (!next.dqcx_pursuit_window_start && !next.dqcx_pursuit_window_end && next.L3) {
    next.dqcx_pursuit_window_start = addMonths(next.L3, -18);
    next.dqcx_pursuit_window_end = addMonths(next.L3, -6);
  }
  return next;
}

export function applyScoring(
  input: ProjectInput,
  now = new Date(),
): Project {
  const dates = derivePursuitWindow(input.dates);
  const scoredPartial = { ...input, dates };
  const breakdown = scoreProject(scoredPartial, now);
  const next_action = suggestNextAction(scoredPartial, breakdown.band);
  const nowIso = now.toISOString();
  return {
    ...input,
    dates,
    project_id: input.project_id || slugId(input.name),
    opportunity_score: breakdown.score,
    score_band: breakdown.band,
    score_rationale: breakdown.rationale,
    score_breakdown: breakdown,
    next_action,
    created_at: input.created_at ?? nowIso,
    updated_at: nowIso,
  };
}

export function slugId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 7);
  return slug ? `${slug}-${rand}` : `prj-${rand}`;
}

export function newProjectDraft(): ProjectInput {
  return {
    project_id: "",
    name: "",
    aliases: [],
    campus: null,
    building: null,
    city: null,
    state: null,
    country: "US",
    region: "Other",
    dq_number: null,
    record_kind: "live",
    project_type: "unknown",
    it_mw: null,
    critical_mw: null,
    buildings: null,
    high_density: null,
    liquid_cool: null,
    value_usd: null,
    status: "watching",
    owner: null,
    developer: null,
    tenant: null,
    gc: null,
    mep: null,
    utility: null,
    cxa_incumbent: null,
    tab: null,
    electrical_contractor: null,
    mechanical_contractor: null,
    oem_vendors: [],
    bd_owner_internal: null,
    cx_award_status: "unknown",
    relationship: "unknown",
    dates: emptyDates(),
    scope_fit: emptyScopeFit(),
    next_action: "",
    next_action_due: null,
    sources: [],
    field_confidence: {},
    notes: null,
  };
}

export function effectivePursuitWindow(
  project: Project,
): { start: Date; end: Date } | null {
  const start = parseDate(project.dates.dqcx_pursuit_window_start);
  const end = parseDate(project.dates.dqcx_pursuit_window_end);
  if (start && end) return { start, end };
  if (start && !end) {
    return { start, end: new Date(start.getTime() + 90 * 86400000) };
  }
  if (end && !start) {
    return { start: new Date(end.getTime() - 90 * 86400000), end };
  }
  return null;
}

export function isInAlertWindow(project: Project, now = new Date()): boolean {
  const win = effectivePursuitWindow(project);
  if (!win) return false;
  const horizon = new Date(now.getTime() + 90 * 86400000);
  const overlapsNow = now >= win.start && now <= win.end;
  const opensSoon = win.start > now && win.start <= horizon;
  return overlapsNow || opensSoon;
}

export function needTags(project: Project): string[] {
  const tags: string[] = [];
  const conf = (key: string, filled: boolean) => {
    const c = project.field_confidence[key];
    if (!filled || c === "unknown") return true;
    return false;
  };
  if (conf("it_mw", project.it_mw != null) && project.critical_mw == null) tags.push("NEED: IT MW");
  if (conf("dates.L3", Boolean(project.dates.L3))) tags.push("NEED: L3 date");
  if (conf("owner", Boolean(project.owner))) tags.push("NEED: owner");
  if (conf("gc", Boolean(project.gc))) tags.push("NEED: GC");
  if (conf("cxa_incumbent", Boolean(project.cxa_incumbent))) tags.push("NEED: CxA incumbent");
  if (conf("utility", Boolean(project.utility))) tags.push("NEED: utility");
  if (conf("tab", Boolean(project.tab))) tags.push("NEED: TAB");
  if (project.value_usd == null || project.field_confidence.value_usd === "unknown") {
    tags.push("NEED: sourced $");
  }
  if (project.sources.length === 0) tags.push("NEED: primary source");
  return tags;
}

export { parseDate };
