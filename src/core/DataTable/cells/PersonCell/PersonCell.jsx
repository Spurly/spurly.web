import { Avatar } from 'src/core/primitives';
import { resolveDensity } from 'src/core/tokens';
import { useProfilePhoto } from 'src/core/people/hooks/profilePhoto';

/**
 * A person: avatar + name, optionally with one piece of quiet metadata.
 *
 * The photo is looked up here from `profileUrl` rather than passed in, for the
 * same reason CompanyCell looks up its logo — see common/utils/profilePhoto.js.
 * An explicit `avatar` prop still wins, for callers that already hold a url.
 *
 * Failure is invisible by design. No photo captured, storage not configured,
 * a dead CDN, a 404 — all of them land on Avatar's tinted initial, which is
 * what this cell drew before photos existed and is a perfectly good cell.
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
export function PersonCell({
  name,
  avatar = null,
  profileUrl = null,
  meta = null,
  metaTitle,
  subtitle = null,
  density = 'default',
}) {
  const captured = useProfilePhoto(profileUrl);
  const d = resolveDensity(density);

  if (!name) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  const src = avatar || captured || null;

  return (
    <span className="flex items-center gap-2.5 min-w-0 w-full">
      <Avatar src={src} name={name} size={d.avatar} />
      {subtitle ? (
        <span className="min-w-0 flex flex-col">
          <span className="truncate text-[length:var(--ui-t-nav)] font-medium leading-[1.3] text-[var(--ui-text-primary)]">{name}</span>
          <span className="truncate text-[length:var(--ui-t-meta)] leading-[1.35] text-[var(--ui-text-quaternary)]">{subtitle}</span>
        </span>
      ) : (
        <span className="truncate text-[length:var(--ui-t-nav)] font-medium text-[var(--ui-text-primary)]">{name}</span>
      )}
      {meta && (
        <span
          title={metaTitle}
          className="ml-auto shrink-0 pl-2 text-[length:var(--ui-t-meta)] tabular-nums text-[var(--ui-text-tertiary)]"
        >
          {meta}
        </span>
      )}
    </span>
  );
}
