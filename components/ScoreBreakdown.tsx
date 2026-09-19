import type { ScoreBreakdown } from "@/lib/types";

export function ScoreBreakdownView({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="space-y-3">
      {breakdown.components.map((c) => {
        const pct = Math.round((c.points / c.weight) * 100);
        return (
          <div key={c.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-radar-muted">
                {c.label}
              </span>
              <span className="font-mono text-xs text-radar-ink">
                {c.points} / {c.weight}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-radar-line">
              <div
                className="h-full bg-radar-cyan"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-radar-muted">{c.reason}</p>
          </div>
        );
      })}
      {breakdown.adjustments.map((a) => (
        <p key={a.label} className="font-mono text-xs text-radar-danger">
          {a.label}: {a.points}
        </p>
      ))}
      {breakdown.cap ? (
        <p className="rounded-sm border border-radar-warn/30 bg-radar-warn/5 px-2 py-1.5 text-xs text-radar-warn">
          {breakdown.cap}
        </p>
      ) : null}
      <p className="text-sm text-radar-muted">{breakdown.rationale}</p>
    </div>
  );
}
