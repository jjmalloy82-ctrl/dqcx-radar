import { ProjectForm } from "@/components/ProjectForm";
import { getProject } from "@/lib/db";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-radar-cyan">
          Edit record
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{project.name}</h1>
      </div>
      <ProjectForm project={project} />
    </div>
  );
}
