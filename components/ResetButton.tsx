"use client";

import { resetDemoAction } from "@/lib/actions";
import { useTransition } from "react";

export function ResetButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Reset demo data? This replaces the board with the seeded Radar records.",
          )
        ) {
          start(() => resetDemoAction());
        }
      }}
      className="rounded-sm border border-radar-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-radar-muted hover:border-radar-cyan/40 hover:text-radar-cyan disabled:opacity-50"
    >
      {pending ? "Resetting…" : "Reset demo data"}
    </button>
  );
}
