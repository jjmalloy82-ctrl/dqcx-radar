import { ProjectForm } from "@/components/ProjectForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-radar-cyan">
          New record
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Add project</h1>
        <p className="mt-1 text-sm text-radar-muted">
          Sparse is correct. Name plus a city is enough to land on the board as
          intel_only until you attach a primary source.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
