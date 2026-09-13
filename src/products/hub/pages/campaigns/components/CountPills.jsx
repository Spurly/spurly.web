/**
 * Progress is four counts and never a bar. A campaign's denominator does not
 * move but its numerator advances a handful of times an hour inside working
 * hours, so a bar would sit visibly still for most of a working day and read
 * as stuck.
 *
 * Lived in CampaignRow.jsx until the list became a DataTable; the row is gone,
 * the reasoning is not.
 */
export function CountPills({ counts }) {
  const parts = [
    { key: 'invited', label: 'invited', tone: 'text-[var(--ui-text-primary)]' },
    { key: 'pending', label: 'queued', tone: 'text-[var(--ui-text-secondary)]' },
    { key: 'skipped', label: 'skipped', tone: 'text-[var(--ui-text-tertiary)]' },
    { key: 'failed', label: 'failed', tone: 'text-[var(--ui-danger-fg)]' },
  ].filter((p) => (counts?.[p.key] ?? 0) > 0);

  // A brand-new campaign has only queued members; showing three zeroes next to
  // it would be noise dressed as data.
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
