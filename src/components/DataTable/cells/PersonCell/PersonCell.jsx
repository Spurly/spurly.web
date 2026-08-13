import { Avatar } from 'src/ui/primitives';
import { resolveDensity } from 'src/ui/tokens';

/**
 * A person: avatar + name, optionally with one piece of quiet metadata.
 *
 * The meta slot is pinned to the RIGHT EDGE of the column, not placed after the
 * name. Trailing the name puts it at a different x-position on every row —
 * whatever the name happens to end — so a column of values reads as scattered
 * rather than as a column. Right-aligning costs nothing and gives a clean
 * vertical rule.
 *
 * Stays on ONE line: stacking the name and its meta is what made rows grow to
 * two lines in the old table.
 */
export function PersonCell({ name, avatar = null, meta = null, metaTitle, density = 'default' }) {
  const d = resolveDensity(density);

  if (!name) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  return (
    <span className="flex items-center gap-2 min-w-0 w-full">
      <Avatar src={avatar} name={name} size={d.avatar} />
      <span className="truncate font-medium text-[var(--ui-text-primary)]">{name}</span>
      {meta && (
        <span
          title={metaTitle}
          className="ml-auto shrink-0 pl-2 text-[11px] tabular-nums text-[var(--ui-text-tertiary)]"
        >
          {meta}
        </span>
      )}
    </span>
  );
}
