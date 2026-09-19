export function NeedTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex w-full flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="shrink-0 rounded-sm bg-radar-danger/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-radar-danger ring-1 ring-radar-danger/30"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
