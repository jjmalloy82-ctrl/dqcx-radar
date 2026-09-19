import { ConfidenceChip } from "@/components/ConfidenceChip";
import { DeleteButton } from "@/components/DeleteButton";
import { NeedTags } from "@/components/NeedTags";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreBreakdownView } from "@/components/ScoreBreakdown";
import { Timeline } from "@/components/Timeline";
import { getProject } from "@/lib/db";
import { formatDate, formatMw, formatUsd, locationLine, statusLabel } from "@/lib/format";
import { needTags } from "@/lib/scoring";
import { SCOPE_KEYS, SCOPE_LABELS, type Confidence } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function Row({
  label,
  value,
  confidence,
}: {
  label: string;
  value: ReactNode;
  confidence?: Confidence;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-radar-line/60 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-radar-muted">
        {label}
      </span>
      <span className="text-right text-sm">
        {value ?? "—"}
        {confidence ? <ConfidenceChip value={confidence} /> : null}
      </span>
    </div>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const conf = project.field_confidence;
  const tags = needTags(project);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-radar-cyan">
            {project.record_kind === "example" ? "Example record · not a live pursuit" : "Master record"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold">{project.name}</h1>
          <p className="mt-1 text-sm text-radar-muted">
            {locationLine(project)}
            {project.dq_number ? ` · DQ# ${project.dq_number}` : ""}
            {project.aliases.length ? ` · ${project.aliases.join(" · ")}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ScoreBadge score={project.opportunity_score} band={project.score_band} />
            {project.record_kind === "example" ? (
              <span className="rounded-sm bg-radar-warn/15 px-2 py-0.5 font-mono text-[10px] uppercase text-radar-warn">
                Example
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/projects/${project.project_id}/edit`}
            className="rounded-sm bg-radar-cyan px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-radar"
          >
            Edit
          </Link>
          <DeleteButton projectId={project.project_id} />
        </div>
      </div>

      <div className="rounded-md border border-radar-cyan/30 bg-radar-elev p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-radar-cyan">
          Next action
        </p>
        <p className="mt-1 text-lg">{project.next_action}</p>
        {project.next_action_due ? (
          <p className="mt-1 font-mono text-xs text-radar-muted">
            Due {formatDate(project.next_action_due)}
          </p>
        ) : null}
        <div className="mt-3">
          <NeedTags tags={tags} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-md border border-radar-line bg-radar-elev p-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
            What
          </h2>
          <div className="mt-3">
            <Row label="Type" value={project.project_type} confidence={conf.project_type} />
            <Row label="Status" value={statusLabel(project.status)} />
            <Row label="Campus" value={project.campus} />
            <Row label="Building" value={project.building} />
            <Row label="IT MW" value={formatMw(project.it_mw)} confidence={conf.it_mw} />
            <Row
              label="Critical MW"
              value={formatMw(project.critical_mw)}
              confidence={conf.critical_mw}
            />
            <Row label="Buildings" value={project.buildings} />
            <Row label="High density" value={flag(project.high_density)} />
            <Row label="Liquid cool" value={flag(project.liquid_cool)} confidence={conf.liquid_cool} />
            <Row
              label="Value USD"
              value={formatUsd(project.value_usd)}
              confidence={conf.value_usd}
            />
          </div>
        </section>

        <section className="rounded-md border border-radar-line bg-radar-elev p-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
            Who
          </h2>
          <div className="mt-3">
            <Row label="Owner" value={project.owner} confidence={conf.owner} />
            <Row label="Developer" value={project.developer} />
            <Row label="Tenant" value={project.tenant} />
            <Row label="GC" value={project.gc} confidence={conf.gc} />
            <Row label="MEP" value={project.mep} />
            <Row label="Utility" value={project.utility} confidence={conf.utility} />
            <Row
              label="CxA incumbent"
              value={project.cxa_incumbent}
              confidence={conf.cxa_incumbent}
            />
            <Row label="TAB" value={project.tab} confidence={conf.tab} />
            <Row label="Electrical" value={project.electrical_contractor} />
            <Row label="Mechanical" value={project.mechanical_contractor} />
            <Row
              label="OEMs"
              value={project.oem_vendors.length ? project.oem_vendors.join(", ") : "—"}
            />
            <Row label="BD owner" value={project.bd_owner_internal} />
            <Row label="Cx award" value={project.cx_award_status} />
            <Row label="Relationship" value={project.relationship} />
          </div>
        </section>

        <section className="rounded-md border border-radar-line bg-radar-elev p-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
            When · L0–L6
          </h2>
          <div className="mt-3">
            <Timeline project={project} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-radar-line bg-radar-elev p-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
            Score breakdown
          </h2>
          <div className="mt-4">
            <ScoreBreakdownView breakdown={project.score_breakdown} />
          </div>
        </section>
        <section className="space-y-4">
          <div className="rounded-md border border-radar-line bg-radar-elev p-4">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
              Scope fit
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SCOPE_KEYS.map((k) => (
                <div key={k} className="rounded-sm border border-radar-line/80 px-2 py-1.5">
                  <p className="font-mono text-[10px] uppercase text-radar-muted">
                    {SCOPE_LABELS[k]}
                  </p>
                  <p className="text-sm">{project.scope_fit[k]}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-radar-line bg-radar-elev p-4">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
              Sources
            </h2>
            {project.sources.length === 0 ? (
              <p className="mt-3 text-sm text-radar-muted">
                No sources. External facts cannot be confirmed.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {project.sources.map((s, i) => (
                  <li key={i} className="border-b border-radar-line/50 pb-3 last:border-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-radar-muted">
                      {s.type} · {s.date || "undated"}
                    </p>
                    <p className="mt-1 text-sm">{s.quote || "—"}</p>
                    {s.url ? (
                      <a
                        href={s.url}
                        className="mt-1 inline-block break-all font-mono text-xs text-radar-cyan"
                      >
                        {s.url}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {project.notes ? (
        <section className="rounded-md border border-radar-line bg-radar-elev p-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-radar-muted">{project.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

function flag(v: boolean | null): string {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "—";
}
