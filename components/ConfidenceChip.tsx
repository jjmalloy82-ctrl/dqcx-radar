import { confidenceClass } from "@/lib/format";
import type { Confidence } from "@/lib/types";

export function ConfidenceChip({ value }: { value?: Confidence }) {
  const v = value ?? "unknown";
  return (
    <span
      className={`ml-2 inline-flex rounded px-1.5 py-px font-mono text-[10px] uppercase tracking-wider ring-1 ${confidenceClass(v)}`}
    >
      {v}
    </span>
  );
}
