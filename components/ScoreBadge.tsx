import { bandClass, bandLabel } from "@/lib/format";
import type { ScoreBand } from "@/lib/types";

export function ScoreBadge({
  score,
  band,
}: {
  score: number;
  band: ScoreBand;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 font-mono text-xs ring-1 ${bandClass(band)}`}
    >
      <span className="tabular-nums">{score}</span>
      <span className="opacity-80">{bandLabel(band)}</span>
    </span>
  );
}
