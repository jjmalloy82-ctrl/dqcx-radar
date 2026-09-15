import { AppHeader } from "@/components/AppHeader";
import { listProjects } from "@/lib/db";
import { isInAlertWindow } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const alertCount = listProjects().filter((p) => isInAlertWindow(p)).length;
  return (
    <div className="min-h-screen bg-radar">
      <AppHeader alertCount={alertCount} />
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}
