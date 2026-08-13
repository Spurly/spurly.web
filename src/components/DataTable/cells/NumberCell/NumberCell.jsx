export function NumberCell({ value, format = (n) => n.toLocaleString() }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-[var(--ui-text-tertiary)]">—</span>;
  }
  return <span className="tabular-nums text-[var(--ui-text-primary)]">{format(value)}</span>;
}
