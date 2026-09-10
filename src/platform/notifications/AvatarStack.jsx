import { Avatar } from 'src/ui/primitives';

/**
 * A small overlapping row of circular avatars, for notifications that are
 * about a group of people rather than one event — currently just
 * hub.connections_sent's hourly "N connections sent" rollup.
 *
 * Capped at 5 faces plus a "+N" tile: the payload itself is already capped
 * server-side (see CONNECTIONS_SENT_AVATAR_CAP in hub/campaigns/service.js),
 * this cap is just about not overflowing a narrow feed row.
 */
const STACK_CAP = 5;

export function AvatarStack({ people = [], size = 20 }) {
  if (!people.length) return null;
  const shown = people.slice(0, STACK_CAP);
  const overflow = people.length - shown.length;
  const overlap = -Math.round(size * 0.35);

  return (
    <span className="flex items-center mt-1.5" aria-hidden="true">
      {shown.map((person, i) => (
        <span
          key={person.profileUrl || person.name || i}
          className="block rounded-full shrink-0"
          style={{
            marginLeft: i === 0 ? 0 : overlap,
            zIndex: shown.length - i,
            boxShadow: '0 0 0 2px var(--ui-surface-card)',
          }}
        >
          <Avatar src={person.profilePictureUrl || null} name={person.name} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="grid place-items-center rounded-full text-[10px] font-medium shrink-0"
          style={{
            width: size,
            height: size,
            marginLeft: overlap,
            background: 'var(--ui-surface-sunken)',
            color: 'var(--ui-text-tertiary)',
            boxShadow: '0 0 0 2px var(--ui-surface-card)',
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
