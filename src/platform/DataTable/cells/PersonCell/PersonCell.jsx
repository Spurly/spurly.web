import { Avatar } from 'src/ui/primitives';
import { resolveDensity } from 'src/ui/tokens';
import { useProfilePhoto } from 'src/platform/people/profilePhoto';

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
  density = 'default',
}) {
  const captured = useProfilePhoto(profileUrl);
  const d = resolveDensity(density);

  if (!name) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  const src = avatar || captured || null;

  return (
    <span className="flex items-center gap-2 min-w-0 w-full">
      <Avatar src={src} name={name} size={d.avatar} />
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
