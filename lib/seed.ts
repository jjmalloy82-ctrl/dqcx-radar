import { ingestBoard } from "./ingest";
import type { Project } from "./types";
import board from "../data/projects.json";

export const SEED_VERSION = "listen-board-2026-09-18-115";

export function seedProjects(): Project[] {
  const projects = ingestBoard(board);
  const live = projects.filter((p) => p.record_kind === "live").length;

  if (projects.length < 114 || live < 114) {
    throw new Error(
      `Seed expected 114+ live listen-board campuses, got ${live} live / ${projects.length} total.`,
    );
  }

  const expect: Record<string, { band: Project["score_band"]; score: number }> = {
    "DQ-HUNT-CLEANSPARK-SANDERSVILLE": { band: "develop", score: 78 },
    "DQ-HUNT-BEALE-MARANA": { band: "develop", score: 78 },
    "DQ-HUNT-VANTAGE-FRONTIER": { band: "develop", score: 78 },
  };

  for (const [id, expected] of Object.entries(expect)) {
    const p = projects.find((row) => row.project_id === id);
    if (!p) {
      throw new Error(`Seed missing listen campus ${id}`);
    }
    if (p.score_band !== expected.band || p.opportunity_score !== expected.score) {
      throw new Error(
        `Seed scoring drift: ${p.name} (${p.project_id}) scored ${p.opportunity_score} ${p.score_band}, expected ${expected.score} ${expected.band}`,
      );
    }
  }

  return projects;
}
