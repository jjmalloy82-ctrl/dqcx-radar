import { projectsToCsv } from "@/lib/csv";
import { listProjects } from "@/lib/db";
import type { ProjectType, Region, ScoreBand, Status } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const projects = listProjects({
    region: (url.searchParams.get("region") as Region | null) || "",
    band: (url.searchParams.get("band") as ScoreBand | null) || "",
    status: (url.searchParams.get("status") as Status | null) || "",
    project_type: (url.searchParams.get("project_type") as ProjectType | null) || "",
    q: url.searchParams.get("q") ?? "",
  });
  const csv = projectsToCsv(projects);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dqcx-radar-board-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
