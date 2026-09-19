import {
  BAND_LABELS,
  PROJECT_TYPES,
  REGIONS,
  SCORE_BANDS,
  STATUSES,
  STATUS_LABELS,
} from "@/lib/types";
import type { ProjectFilters } from "@/lib/types";
import Link from "next/link";

export function FilterBar({ filters }: { filters: ProjectFilters }) {
  return (
    <form
      method="get"
      className="grid grid-cols-2 gap-3 rounded-md border border-radar-line bg-radar-elev p-3 md:grid-cols-6"
    >
      <label className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-radar-muted">
        Search
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Name, DQ#, city…"
          className="rounded-sm border border-radar-line bg-radar px-2 py-1.5 font-sans text-sm text-radar-ink placeholder:text-radar-muted/50"
        />
      </label>
      <label className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-radar-muted">
        Region
        <select
          name="region"
          defaultValue={filters.region ?? ""}
          className="rounded-sm border border-radar-line bg-radar px-2 py-1.5 font-sans text-sm text-radar-ink"
        >
          <option value="">All</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-radar-muted">
        Score band
        <select
          name="band"
          defaultValue={filters.band ?? ""}
          className="rounded-sm border border-radar-line bg-radar px-2 py-1.5 font-sans text-sm text-radar-ink"
        >
          <option value="">All</option>
          {SCORE_BANDS.map((b) => (
            <option key={b} value={b}>
              {BAND_LABELS[b]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-radar-muted">
        Status
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-sm border border-radar-line bg-radar px-2 py-1.5 font-sans text-sm text-radar-ink"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-radar-muted">
        Project type
        <select
          name="project_type"
          defaultValue={filters.project_type ?? ""}
          className="rounded-sm border border-radar-line bg-radar px-2 py-1.5 font-sans text-sm text-radar-ink"
        >
          <option value="">All</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-sm bg-radar-cyan px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-radar"
        >
          Filter
        </button>
        <Link
          href="/app"
          className="rounded-sm border border-radar-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-radar-muted"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
