import Link from "next/link";

export function Wordmark({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  const inner = (
    <span className="inline-flex items-baseline gap-2 tracking-[0.18em]">
      <span className="font-semibold text-radar-ink">DQCX</span>
      <span className="font-semibold text-radar-cyan">Radar</span>
    </span>
  );
  if (compact) {
    return (
      <Link href={href} className="font-mono text-[13px] uppercase">
        {inner}
      </Link>
    );
  }
  return (
    <Link href={href} className="font-mono text-sm uppercase">
      {inner}
    </Link>
  );
}
