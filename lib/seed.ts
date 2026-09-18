import { applyScoring } from "./scoring";
import type { Project, ProjectInput } from "./types";
import board from "../data/projects.json";

export const SEED_VERSION = "post-race-2026-09-18";

type BoardFile = {
  seed_version?: string;
  projects?: ProjectInput[];
};

function asInput(row: ProjectInput & Partial<Project>): ProjectInput {
  const {
    opportunity_score: _score,
    score_band: _band,
    score_rationale: _rationale,
    score_breakdown: _breakdown,
    ...input
  } = row;
  return input;
}

function loadSeedInputs(): ProjectInput[] {
  const data = board as BoardFile | ProjectInput[];
  const list = Array.isArray(data) ? data : data.projects;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("data/projects.json has no projects to seed.");
  }
  return list.map((row) => asInput(row as ProjectInput & Partial<Project>));
}

export function seedProjects(): Project[] {
  const projects = loadSeedInputs().map((p) => applyScoring(p));

  const expect: Record<string, { band: Project["score_band"]; score?: number }> = {
    "dq-260022": { band: "monitor" },
    "dq-260013": { band: "intel_only" },
    "hunt-oulu": { band: "intel_only" },
    "hunt-goodnight": { band: "intel_only" },
    "hunt-columbiana": { band: "intel_only" },
    "hunt-smx01": { band: "intel_only" },
    "hunt-cloudburst-tx": { band: "intel_only" },
    "hunt-hyperion-richland": { band: "intel_only" },
    "hunt-tembo-cheyenne": { band: "intel_only" },
    "hunt-clydesdale-owasso": { band: "intel_only" },
    "dq-hunt-cleanspark-sandersville": { band: "develop", score: 78 },
    "dq-hunt-vantage-frontier": { band: "develop", score: 78 },
    "dq-hunt-beale-marana": { band: "develop", score: 78 },
    "dq-hunt-stack-dfw02-lancaster": { band: "monitor", score: 71 },
    "example-north-texas-ai": { band: "pursuit_now" },
  };

  for (const p of projects) {
    const expected = expect[p.project_id];
    if (!expected) continue;
    if (p.score_band !== expected.band) {
      throw new Error(
        `Seed scoring drift: ${p.name} (${p.project_id}) scored ${p.opportunity_score} ${p.score_band}, expected ${expected.band}`,
      );
    }
    if (expected.score != null && p.opportunity_score !== expected.score) {
      throw new Error(
        `Seed scoring drift: ${p.name} (${p.project_id}) scored ${p.opportunity_score}, expected ${expected.score}`,
      );
    }
  }

  return projects;
}
