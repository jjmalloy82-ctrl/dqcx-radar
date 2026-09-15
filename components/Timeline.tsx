import { DATE_KEYS, DATE_LABELS, type Project } from "@/lib/types";
import { formatDate } from "@/lib/format";

const PHASES = DATE_KEYS.filter(
  (k) =>
    k !== "dqcx_pursuit_window_start" &&
    k !== "dqcx_pursuit_window_end" &&
    k !== "cx_award_target",
);

export function Timeline({ project }: { project: Project }) {
  const items = PHASES.map((key) => ({
    key,
    label: DATE_LABELS[key],
    date: project.dates[key],
  }));
  const dated = items.filter((i) => i.date);
  return (
    <div>
      <ol className="relative space-y-0 border-l border-radar-cyan/30 pl-4">
        {items.map((item) => {
          const filled = Boolean(item.date);
          return (
            <li key={item.key} className="relative py-2">
              <span
                className={`absolute top-3 -left-[21px] h-2.5 w-2.5 rounded-full ${
                  filled ? "bg-radar-cyan" : "bg-radar-line"
                }`}
              />
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-radar-muted">
                  {item.label}
                </span>
                <span
                  className={`font-mono text-sm ${filled ? "text-radar-ink" : "text-radar-muted/50"}`}
                >
                  {formatDate(item.date)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 font-mono text-[11px] text-radar-muted">
        Pursuit window: {formatDate(project.dates.dqcx_pursuit_window_start)} →{" "}
        {formatDate(project.dates.dqcx_pursuit_window_end)}
        {dated.length === 0 ? " · no sourced schedule yet" : null}
      </p>
    </div>
  );
}
