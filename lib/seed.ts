import { applyScoring, emptyDates, emptyScopeFit } from "./scoring";
import type { FieldConfidence, Project, ProjectInput, Source } from "./types";

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoMonthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function src(
  type: Source["type"],
  quote: string,
  date: string,
  url = "",
): Source {
  return { type, quote, date, url };
}

function huntCampus(partial: {
  project_id: string;
  name: string;
  campus?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  region: ProjectInput["region"];
  aliases?: string[];
  notes: string;
  field_confidence?: FieldConfidence;
}): ProjectInput {
  return {
    project_id: partial.project_id,
    name: partial.name,
    aliases: partial.aliases ?? [],
    campus: partial.campus ?? partial.name,
    building: null,
    city: partial.city ?? null,
    state: partial.state ?? null,
    country: partial.country ?? null,
    region: partial.region,
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
    next_action: "Enrich from primary source",
    next_action_due: isoDaysFromNow(14),
    sources: [],
    field_confidence: {
      region: partial.region === "Other" && !partial.state ? "unknown" : "inferred",
      ...partial.field_confidence,
    },
    notes: partial.notes,
  };
}

export function seedProjects(): Project[] {
  const summit: ProjectInput = {
    project_id: "dq-260022",
    name: "Summit Project Horizon",
    aliases: ["Project Horizon", "DQ 260022"],
    campus: "Project Horizon",
    building: null,
    city: "Fort Stockton",
    state: "TX",
    country: "US",
    region: "TX",
    dq_number: "260022",
    record_kind: "live",
    project_type: "unknown",
    it_mw: null,
    critical_mw: null,
    buildings: null,
    high_density: null,
    liquid_cool: null,
    value_usd: 645435,
    status: "keep_warm",
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
    bd_owner_internal: "David Dinh",
    cx_award_status: "pending",
    relationship: "existing",
    dates: {
      ...emptyDates(),
      cx_award_target: "2026-09-30",
      dqcx_pursuit_window_start: "2026-09-01",
      dqcx_pursuit_window_end: "2026-10-31",
    },
    scope_fit: emptyScopeFit(),
    next_action:
      "Keep warm with David Dinh — award pending September. Do not staff until owner/GC/L3 are sourced.",
    next_action_due: "2026-09-22",
    sources: [
      src(
        "internal",
        "DQ# 260022 — Summit Project Horizon, Fort Stockton TX. Award pending September. value_usd 645435. BD David Dinh. Status keep warm.",
        "2026-09-01",
      ),
    ],
    field_confidence: {
      name: "confirmed",
      city: "confirmed",
      state: "confirmed",
      region: "confirmed",
      dq_number: "confirmed",
      value_usd: "confirmed",
      bd_owner_internal: "confirmed",
      status: "confirmed",
      cx_award_status: "confirmed",
      relationship: "inferred",
      "dates.cx_award_target": "inferred",
      it_mw: "unknown",
      owner: "unknown",
      gc: "unknown",
      "dates.L3": "unknown",
    },
    notes:
      "Internal BD record only. MW, COD/L3, owner, GC, EPC, and Cx incumbent are unknown. Do not invent them.",
  };

  const coloshield: ProjectInput = {
    project_id: "dq-260013",
    name: "ColoShield - NSCALE Cx",
    aliases: ["ColoShield", "NSCALE Cx", "DQ 260013"],
    campus: "ColoShield",
    building: null,
    city: null,
    state: null,
    country: null,
    region: "Other",
    dq_number: "260013",
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
    next_action:
      "Confirm NSCALE Cx scope from a primary source. Do not book September revenue that is not sourced.",
    next_action_due: isoDaysFromNow(10),
    sources: [
      src(
        "internal",
        "DQ# 260013 — ColoShield - NSCALE Cx. Internal identifier only; no sourced MW, COD, EPC, or dollars.",
        "2026-09-01",
      ),
    ],
    field_confidence: {
      name: "confirmed",
      dq_number: "confirmed",
      region: "unknown",
      project_type: "unknown",
      value_usd: "unknown",
      it_mw: "unknown",
    },
    notes:
      "Sparse CRM stub. Title includes NSCALE — that is not a sourced tenant or award. No invented September revenue.",
  };

  const hunts: ProjectInput[] = [
    huntCampus({
      project_id: "hunt-oulu",
      name: "Oulu",
      campus: "Oulu",
      city: "Oulu",
      country: "Finland",
      region: "Other",
      field_confidence: { city: "inferred", country: "inferred", region: "inferred" },
      notes:
        "Hunt campus — name/location tokens only. Enrich from a primary source before any score move.",
    }),
    huntCampus({
      project_id: "hunt-goodnight",
      name: "Goodnight",
      campus: "Goodnight",
      region: "Other",
      notes: "Hunt campus — name only. No city, MW, COD, or parties on file.",
    }),
    huntCampus({
      project_id: "hunt-columbiana",
      name: "Columbiana",
      campus: "Columbiana",
      city: "Columbiana",
      region: "Other",
      field_confidence: { city: "inferred", region: "unknown" },
      notes: "Hunt campus — city token from the name. State, owner, MW unknown.",
    }),
    huntCampus({
      project_id: "hunt-smx01",
      name: "SMX01",
      campus: "SMX01",
      region: "Other",
      notes: "Hunt campus — site code only. Do not expand the acronym without a source.",
    }),
    huntCampus({
      project_id: "hunt-cloudburst-tx",
      name: "CloudBurst TX",
      campus: "CloudBurst",
      state: "TX",
      country: "US",
      region: "TX",
      field_confidence: { state: "inferred", region: "inferred", country: "inferred" },
      notes: "Hunt campus — Texas token from the name. No MW, COD, or counterparties.",
    }),
    huntCampus({
      project_id: "hunt-hyperion-richland",
      name: "Hyperion Richland Parish",
      campus: "Hyperion",
      city: "Richland Parish",
      region: "Other",
      field_confidence: { city: "inferred", campus: "inferred", region: "unknown" },
      notes: "Hunt campus — locality token from the name. State/owner/MW unknown.",
    }),
    huntCampus({
      project_id: "hunt-tembo-cheyenne",
      name: "Tembo Cheyenne",
      campus: "Tembo",
      city: "Cheyenne",
      region: "Other",
      field_confidence: { city: "inferred", campus: "inferred", region: "unknown" },
      notes: "Hunt campus — city token from the name. State/owner/MW unknown.",
    }),
    huntCampus({
      project_id: "hunt-clydesdale-owasso",
      name: "Clydesdale Owasso",
      campus: "Clydesdale",
      city: "Owasso",
      region: "Other",
      field_confidence: { city: "inferred", campus: "inferred", region: "unknown" },
      notes: "Hunt campus — city token from the name. State/owner/MW unknown.",
    }),
  ];

  const exampleL3 = isoMonthsFromNow(12);
  const example: ProjectInput = {
    project_id: "example-north-texas-ai",
    name: "North Texas AI Campus",
    aliases: ["NTX-AI EXAMPLE", "Radar enrichment template"],
    campus: "North Texas AI Campus",
    building: "Hall A",
    city: "North Texas (unspecified)",
    state: "TX",
    country: "US",
    region: "TX",
    dq_number: "EXAMPLE-000",
    record_kind: "example",
    project_type: "AI/HPC",
    it_mw: 120,
    critical_mw: 132,
    buildings: 2,
    high_density: true,
    liquid_cool: null,
    value_usd: 2400000,
    status: "active_pursuit",
    owner: "EXAMPLE Owner LLC",
    developer: "EXAMPLE Dev Partners",
    tenant: "EXAMPLE hyperscale tenant (unnamed)",
    gc: "EXAMPLE GC",
    mep: "EXAMPLE MEP",
    utility: null,
    cxa_incumbent: null,
    tab: null,
    electrical_contractor: "EXAMPLE Electric",
    mechanical_contractor: "EXAMPLE Mechanical",
    oem_vendors: ["EXAMPLE Switchgear OEM", "EXAMPLE UPS OEM"],
    bd_owner_internal: "EXAMPLE — BD desk",
    cx_award_status: "open",
    relationship: "prior",
    dates: {
      ...emptyDates(),
      announcement: isoMonthsFromNow(-8),
      sitework: isoMonthsFromNow(-3),
      shell: isoMonthsFromNow(2),
      permanent_power: isoMonthsFromNow(8),
      L0: isoMonthsFromNow(4),
      L1: isoMonthsFromNow(6),
      L2: isoMonthsFromNow(9),
      L3: exampleL3,
      L4: isoMonthsFromNow(14),
      L5: isoMonthsFromNow(16),
      L6: isoMonthsFromNow(18),
      IST: isoMonthsFromNow(16),
      RFS: isoMonthsFromNow(20),
    },
    scope_fit: {
      L0: "medium",
      L1: "medium",
      L2: "high",
      L3: "high",
      L4: "high",
      L5: "high",
      L6: "medium",
      IST: "high",
      scripts: "high",
      FAT: "medium",
      TAB: "unknown",
      QAQC: "medium",
    },
    next_action:
      "EXAMPLE: request Cx spec + IST matrix from GC. Confirm utility and TAB (NEED tags).",
    next_action_due: isoDaysFromNow(7),
    sources: [
      src(
        "example",
        "EXAMPLE SOURCE — not a real filing. Used to show how a fully enriched Radar record looks, including NEED tags for remaining holes.",
        isoDaysFromNow(-1),
        "https://example.invalid/north-texas-ai-campus",
      ),
      src(
        "example",
        "EXAMPLE: value_usd $2,400,000 is a labeled demo Cx-scope figure, not a live pursuit.",
        isoDaysFromNow(-1),
      ),
    ],
    field_confidence: {
      name: "confirmed",
      region: "confirmed",
      project_type: "confirmed",
      it_mw: "confirmed",
      critical_mw: "inferred",
      value_usd: "confirmed",
      owner: "confirmed",
      gc: "confirmed",
      "dates.L3": "confirmed",
      utility: "unknown",
      tab: "unknown",
      cxa_incumbent: "unknown",
      liquid_cool: "unknown",
    },
    notes:
      "EXAMPLE RECORD — not a real DataQuestCX pursuit. Shows a complete who/what/when plus NEED tags on utility, TAB, CxA incumbent, and liquid cooling. Do not mix this into live pipeline math.",
  };

  const projects = [summit, coloshield, ...hunts, example].map((p) =>
    applyScoring(p),
  );

  const expectBand: Record<string, Project["score_band"]> = {
    "dq-260022": "monitor",
    "dq-260013": "intel_only",
    "hunt-oulu": "intel_only",
    "hunt-goodnight": "intel_only",
    "hunt-columbiana": "intel_only",
    "hunt-smx01": "intel_only",
    "hunt-cloudburst-tx": "intel_only",
    "hunt-hyperion-richland": "intel_only",
    "hunt-tembo-cheyenne": "intel_only",
    "hunt-clydesdale-owasso": "intel_only",
    "example-north-texas-ai": "pursuit_now",
  };

  for (const p of projects) {
    const expected = expectBand[p.project_id];
    if (expected && p.score_band !== expected) {
      throw new Error(
        `Seed scoring drift: ${p.name} (${p.project_id}) scored ${p.opportunity_score} ${p.score_band}, expected ${expected}`,
      );
    }
  }

  return projects;
}
