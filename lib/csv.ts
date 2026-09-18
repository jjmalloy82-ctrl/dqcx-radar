import type { Project } from "./types";

function cell(value: string | number | boolean | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const CSV_HEADERS = [
  "project_id",
  "name",
  "region",
  "city",
  "state",
  "project_type",
  "status",
  "score_band",
  "opportunity_score",
  "owner",
  "gc",
  "dq_number",
  "next_action",
  "it_mw",
  "critical_mw",
  "record_kind",
] as const;

export function projectsToCsv(projects: Project[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const p of projects) {
    lines.push(
      [
        p.project_id,
        p.name,
        p.region,
        p.city,
        p.state,
        p.project_type,
        p.status,
        p.score_band,
        p.opportunity_score,
        p.owner,
        p.gc,
        p.dq_number,
        p.next_action,
        p.it_mw,
        p.critical_mw,
        p.record_kind,
      ]
        .map(cell)
        .join(","),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function filtersToQuery(filters: {
  region?: string;
  band?: string;
  status?: string;
  project_type?: string;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.region) params.set("region", filters.region);
  if (filters.band) params.set("band", filters.band);
  if (filters.status) params.set("status", filters.status);
  if (filters.project_type) params.set("project_type", filters.project_type);
  return params.toString();
}
