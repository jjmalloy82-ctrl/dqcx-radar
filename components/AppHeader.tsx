import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ResetButton } from "@/components/ResetButton";

export function AppHeader({ alertCount }: { alertCount: number }) {
  return (
    <header className="border-b border-radar-line bg-radar-elev/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Wordmark compact href="/app" />
          <nav className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-radar-muted">
            <Link className="hover:text-radar-cyan" href="/app">
              Board
            </Link>
            <Link className="hover:text-radar-cyan" href="/app/alerts">
              Daily alerts
              {alertCount > 0 ? (
                <span className="ml-2 rounded-full bg-radar-cyan/15 px-1.5 py-0.5 text-radar-cyan">
                  {alertCount}
                </span>
              ) : null}
            </Link>
            <Link className="hover:text-radar-cyan" href="/app/projects/new">
              Add project
            </Link>
            <Link className="hover:text-radar-muted/70" href="/">
              About
            </Link>
          </nav>
        </div>
        <ResetButton />
      </div>
    </header>
  );
}
