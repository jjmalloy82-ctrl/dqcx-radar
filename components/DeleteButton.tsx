"use client";

import { deleteProjectAction } from "@/lib/actions";
import { useTransition } from "react";

export function DeleteButton({ projectId }: { projectId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this project record?")) {
          start(() => deleteProjectAction(projectId));
        }
      }}
      className="rounded-sm border border-radar-danger/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-radar-danger hover:bg-radar-danger/10 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
