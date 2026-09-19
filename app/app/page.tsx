import { FilterBar } from "@/components/FilterBar";
import { NeedTags } from "@/components/NeedTags";
import { ScoreBadge } from "@/components/ScoreBadge";
import { filtersToQuery } from "@/lib/csv";
import { listProjects } from "@/lib/db";
import { locationLine, statusLabel } from "@/lib/format";
import { needTags } from "@/lib/scoring";
import type { ProjectFilters, ProjectType, Region, ScoreBand, Status } from "@/lib/types";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Search = {
  region?: string;
  band?: string;
  status?: string;
  project_type?: string;
  q?: string;
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filters: ProjectFilters = {
    region: (sp.region as Region | undefined) || "",
    band: (sp.band as ScoreBand | undefined) || "",
    status: (sp.status as Status | undefined) || "",
    project_type: (sp.project_type as ProjectType | undefined) || "",
    q: sp.q ?? "",
  };
  const projects = listProjects(filters);
  const exportQuery = filtersToQuery(filters);
  const exportHref = exportQuery ? `/app/export?${exportQuery}` : "/app/export";

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-radar-cyan">
            Pursuit board
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Radar</h1>
          <p className="mt-1 text-sm text-radar-muted">
            {projects.length} record{projects.length === 1 ? "" : "s"} · scored
            function, not a news feed · develop first
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={exportHref}
            className="rounded-sm border border-radar-line px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-radar-muted hover:text-radar-cyan"
          >
            Export CSV
          </Link>
          <Link
            href="/app/projects/new"
            className="rounded-sm bg-radar-cyan px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-radar"
          >
            Add project
          </Link>
        </div>
      </div>

      <FilterBar filters={filters} />

      <div className="overflow-x-auto rounded-md border border-radar-line">
        <table className="min-w-full text-sm">
          <thead className="bg-radar-elev font-mono text-[10px] uppercase tracking-wider text-radar-muted">
            <tr>
              <th className="px-3 py-2 text-left">Project</th>
              <th className="px-3 py-2 text-left">Region</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Score</th>
              <th className="px-3 py-2 text-left">Next action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.project_id}
                className="border-t border-radar-line hover:bg-radar-elev/60"
              >
                <td className="px-3 py-3">
                  <Link
                    href={`/app/projects/${p.project_id}`}
                    className="font-medium text-radar-ink hover:text-radar-cyan"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-radar-muted">
                    {p.record_kind === "example" ? (
                      <span className="rounded-sm bg-radar-warn/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-radar-warn">
                        Example
                      </span>
                    ) : null}
                    {p.dq_number ? (
                      <span className="font-mono">DQ# {p.dq_number}</span>
                    ) : null}
                    <span>{locationLine(p)}</span>
                  </div>
                  <div className="mt-2">
                    <NeedTags tags={needTags(p).slice(0, 3)} />
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-xs">{p.region}</td>
                <td className="px-3 py-3 text-radar-muted">{p.project_type}</td>
                <td className="px-3 py-3 text-radar-muted">{statusLabel(p.status)}</td>
                <td className="px-3 py-3">
                  <ScoreBadge score={p.opportunity_score} band={p.score_band} />
                </td>
                <td className="max-w-xs px-3 py-3 text-radar-muted">
                  {p.next_action}
                </td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-radar-muted">
                  No records match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
