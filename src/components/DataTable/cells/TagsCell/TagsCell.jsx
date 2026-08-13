import { Badge } from 'src/ui/primitives';

/**
 * A list of short labels, capped so the cell cannot grow. The old SkillsCell
 * used `flex-wrap`, which let a person with 12 skills set the height of the
 * entire row.
 */
export function TagsCell({ value = [], max = 2, getLabel = (item) => (typeof item === 'string' ? item : item?.name) }) {
  const items = Array.isArray(value) ? value.filter(Boolean) : [];
  if (items.length === 0) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  const shown = items.slice(0, max);
  const overflow = items.length - shown.length;
  const allLabels = items.map(getLabel).filter(Boolean).join(', ');

  return (
    <span className="flex items-center gap-1 min-w-0" title={allLabels}>
      {shown.map((item, i) => (
        <Badge key={getLabel(item) ?? i} size="sm" tone="neutral">
          {getLabel(item)}
        </Badge>
      ))}
      {overflow > 0 && (
        <span className="shrink-0 text-[11px] text-[var(--ui-text-tertiary)] tabular-nums">
          +{overflow}
        </span>
      )}
    </span>
  );
}
