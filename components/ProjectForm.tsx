"use client";

import { saveProjectFormAction } from "@/lib/actions";
import {
  CONFIDENCE,
  CX_AWARD_STATUSES,
  DATE_KEYS,
  DATE_LABELS,
  LIKELIHOODS,
  PROJECT_TYPES,
  RECORD_KINDS,
  REGIONS,
  RELATIONSHIPS,
  SCOPE_KEYS,
  SCOPE_LABELS,
  SOURCE_TYPES,
  STATUSES,
  STATUS_LABELS,
  type Project,
  type Source,
} from "@/lib/types";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-radar-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-sm border border-radar-line bg-radar px-2 py-1.5 text-sm text-radar-ink placeholder:text-radar-muted/40";

function triValue(v: boolean | null | undefined): string {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "unknown";
}

export function ProjectForm({ project }: { project?: Project }) {
  const initialSources: Source[] = useMemo(
    () =>
      project?.sources?.length
        ? project.sources
        : [{ url: "", type: "internal", date: "", quote: "" }],
    [project],
  );
  const [sources, setSources] = useState<Source[]>(initialSources);

  return (
    <form action={saveProjectFormAction} className="space-y-8">
      <input type="hidden" name="project_id" value={project?.project_id ?? ""} />
      <input type="hidden" name="source_count" value={sources.length} />

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          Identity
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name *">
            <input
              required
              name="name"
              defaultValue={project?.name ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Aliases (comma-separated)">
            <input
              name="aliases"
              defaultValue={project?.aliases.join(", ") ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Campus">
            <input name="campus" defaultValue={project?.campus ?? ""} className={inputClass} />
          </Field>
          <Field label="Building">
            <input name="building" defaultValue={project?.building ?? ""} className={inputClass} />
          </Field>
          <Field label="City">
            <input name="city" defaultValue={project?.city ?? ""} className={inputClass} />
          </Field>
          <Field label="State">
            <input name="state" defaultValue={project?.state ?? ""} className={inputClass} />
          </Field>
          <Field label="Country">
            <input name="country" defaultValue={project?.country ?? ""} className={inputClass} />
          </Field>
          <Field label="Region">
            <select name="region" defaultValue={project?.region ?? "Other"} className={inputClass}>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="DQ#">
            <input name="dq_number" defaultValue={project?.dq_number ?? ""} className={inputClass} />
          </Field>
          <Field label="Record kind">
            <select
              name="record_kind"
              defaultValue={project?.record_kind ?? "live"}
              className={inputClass}
            >
              {RECORD_KINDS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          What
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Project type">
            <select
              name="project_type"
              defaultValue={project?.project_type ?? "unknown"}
              className={inputClass}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={project?.status ?? "watching"} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="IT MW">
            <input
              name="it_mw"
              type="number"
              step="0.1"
              defaultValue={project?.it_mw ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Critical MW">
            <input
              name="critical_mw"
              type="number"
              step="0.1"
              defaultValue={project?.critical_mw ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Buildings">
            <input
              name="buildings"
              type="number"
              defaultValue={project?.buildings ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Value USD (sourced only)">
            <input
              name="value_usd"
              type="number"
              defaultValue={project?.value_usd ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="High density">
            <select
              name="high_density"
              defaultValue={triValue(project?.high_density)}
              className={inputClass}
            >
              <option value="unknown">unknown</option>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </Field>
          <Field label="Liquid cool">
            <select
              name="liquid_cool"
              defaultValue={triValue(project?.liquid_cool)}
              className={inputClass}
            >
              <option value="unknown">unknown</option>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </Field>
        </div>
        <p className="text-xs text-radar-muted">
          Never invent MW, COD, EPC, or dollars. Leave blank when unknown.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          Who
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {(
            [
              ["owner", "Owner"],
              ["developer", "Developer"],
              ["tenant", "Tenant"],
              ["gc", "GC"],
              ["mep", "MEP"],
              ["utility", "Utility"],
              ["cxa_incumbent", "CxA incumbent"],
              ["tab", "TAB"],
              ["electrical_contractor", "Electrical contractor"],
              ["mechanical_contractor", "Mechanical contractor"],
              ["bd_owner_internal", "BD owner (internal)"],
            ] as const
          ).map(([name, label]) => (
            <Field key={name} label={label}>
              <input
                name={name}
                defaultValue={project?.[name] ?? ""}
                className={inputClass}
              />
            </Field>
          ))}
          <Field label="OEM vendors (comma-separated)">
            <input
              name="oem_vendors"
              defaultValue={project?.oem_vendors.join(", ") ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Cx award status">
            <select
              name="cx_award_status"
              defaultValue={project?.cx_award_status ?? "unknown"}
              className={inputClass}
            >
              {CX_AWARD_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Relationship">
            <select
              name="relationship"
              defaultValue={project?.relationship ?? "unknown"}
              className={inputClass}
            >
              {RELATIONSHIPS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          Schedule
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          {DATE_KEYS.map((key) => (
            <Field key={key} label={DATE_LABELS[key]}>
              <input
                type="date"
                name={`date_${key}`}
                defaultValue={project?.dates[key] ?? ""}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <p className="text-xs text-radar-muted">
          Best schedule fit is 6–18 months before L3. If L3 is set and pursuit window is blank, Radar derives the window.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          Scope fit
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          {SCOPE_KEYS.map((key) => (
            <Field key={key} label={SCOPE_LABELS[key]}>
              <select
                name={`scope_${key}`}
                defaultValue={project?.scope_fit[key] ?? "unknown"}
                className={inputClass}
              >
                {LIKELIHOODS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          Next action
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Next action">
            <input
              name="next_action"
              defaultValue={project?.next_action ?? ""}
              placeholder="Leave blank to auto-suggest from score band"
              className={inputClass}
            />
          </Field>
          <Field label="Due">
            <input
              type="date"
              name="next_action_due"
              defaultValue={project?.next_action_due ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            defaultValue={project?.notes ?? ""}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          Field confidence
        </h2>
        <p className="text-xs text-radar-muted">
          Confirmed / inferred / unknown per key field. External facts require a source.
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["it_mw", "IT MW"],
            ["critical_mw", "Critical MW"],
            ["value_usd", "Value USD"],
            ["owner", "Owner"],
            ["gc", "GC"],
            ["cxa_incumbent", "CxA incumbent"],
            ["dates.L3", "L3 date"],
            ["region", "Region"],
            ["project_type", "Project type"],
            ["utility", "Utility"],
            ["tab", "TAB"],
          ].map(([key, label]) => (
            <Field key={key} label={`${label} confidence`}>
              <select
                name={`conf_${key}`}
                defaultValue={project?.field_confidence[key] ?? "unknown"}
                className={inputClass}
              >
                {CONFIDENCE.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
            Sources
          </h2>
          <button
            type="button"
            onClick={() =>
              setSources((s) => [...s, { url: "", type: "internal", date: "", quote: "" }])
            }
            className="font-mono text-[11px] uppercase tracking-wider text-radar-cyan"
          >
            Add source
          </button>
        </div>
        <div className="space-y-3">
          {sources.map((s, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-md border border-radar-line bg-radar-elev p-3 md:grid-cols-4"
            >
              <Field label="Type">
                <select
                  name={`source_${i}_type`}
                  defaultValue={s.type}
                  className={inputClass}
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  name={`source_${i}_date`}
                  defaultValue={s.date}
                  className={inputClass}
                />
              </Field>
              <Field label="URL">
                <input
                  name={`source_${i}_url`}
                  defaultValue={s.url}
                  className={inputClass}
                />
              </Field>
              <Field label="Quote / fact">
                <input
                  name={`source_${i}_quote`}
                  defaultValue={s.quote}
                  className={inputClass}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-sm bg-radar-cyan px-4 py-2 font-mono text-xs uppercase tracking-wider text-radar"
        >
          Save project
        </button>
        <Link
          href="/app"
          className="rounded-sm border border-radar-line px-4 py-2 font-mono text-xs uppercase tracking-wider text-radar-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
