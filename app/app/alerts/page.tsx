import { NeedTags } from "@/components/NeedTags";
import { ScoreBadge } from "@/components/ScoreBadge";
import { listProjects } from "@/lib/db";
import { locationLine } from "@/lib/format";
import { isInAlertWindow, needTags } from "@/lib/scoring";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AlertsPage() {
  const alerts = listProjects().filter((p) => isInAlertWindow(p));
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-radar-cyan">
          Daily signal
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Call window — now / next 90 days</h1>
        <p className="mt-1 max-w-2xl text-sm text-radar-muted">
          Projects whose DQCX pursuit window is open today or starts within 90
          days. If L3 is known and the window was blank, Radar derived it as L3
          minus 18 months through L3 minus 6 months.
        </p>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-md border border-radar-line bg-radar-elev p-6 text-radar-muted">
          No pursuit windows in the next 90 days. Enrich L3 dates on live records
          to light this up.
        </p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((p) => (
            <li
              key={p.project_id}
              className="rounded-md border border-radar-line bg-radar-elev p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/app/projects/${p.project_id}`}
                    className="text-lg font-medium hover:text-radar-cyan"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 text-sm text-radar-muted">
                    {locationLine(p)} · window{" "}
                    {p.dates.dqcx_pursuit_window_start} →{" "}
                    {p.dates.dqcx_pursuit_window_end}
                  </p>
                </div>
                <ScoreBadge score={p.opportunity_score} band={p.score_band} />
              </div>
              <p className="mt-3 text-sm">{p.next_action}</p>
              <div className="mt-3">
                <NeedTags tags={needTags(p).slice(0, 4)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
