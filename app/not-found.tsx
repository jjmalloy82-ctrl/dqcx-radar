import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-radar-cyan">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Record not on Radar</h1>
      <p className="mt-2 text-sm text-radar-muted">
        That project_id is not in the SQLite store.
      </p>
      <Link
        href="/app"
        className="mt-6 inline-block font-mono text-xs uppercase tracking-wider text-radar-cyan"
      >
        Back to the board
      </Link>
    </div>
  );
}
