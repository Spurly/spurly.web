/**
 * Progress is counts, not a bar — same reasoning as campaigns' CountPills:
 * an enrichment batch's denominator does not move, and unlike a paced send
 * the numerator here can jump by several within seconds, so a bar would
 * either lag or flicker rather than read as "still working".
 */
export function CountPills({ counts }) {
  const parts = [
    { key: 'enriched', label: 'enriched', tone: 'text-[var(--ui-text-primary)]' },
    { key: 'queued', label: 'queued', tone: 'text-[var(--ui-text-secondary)]' },
    { key: 'enriching', label: 'enriching', tone: 'text-[var(--ui-text-secondary)]' },
    { key: 'failed', label: 'failed', tone: 'text-[var(--ui-danger-fg)]' },
  ].filter((p) => (counts?.[p.key] ?? 0) > 0);

  if (parts.length === 0) return <span className="text-[var(--ui-text-tertiary)]">empty</span>;

  return (
    <span className="flex items-center gap-3 tabular-nums">
      {parts.map((p) => (
        <span key={p.key} className={`shrink-0 ${p.tone}`}>
          {counts[p.key].toLocaleString()} {p.label}
        </span>
      ))}
    </span>
  );
}

export default CountPills;
