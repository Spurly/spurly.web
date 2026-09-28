import { Avatar } from 'src/core/primitives';

/**
 * A small overlapping row of circular avatars, for notifications that are
 * about a group of people rather than one event — hub.connections_sent /
 * hub.messages_sent's hourly rollups, and (each person individually) the
 * connection_accepted / leads_enrichment_completed feed rows.
 *
 * Capped at 5 faces plus a "+N" tile: the payload itself is already capped
 * server-side (see CONNECTIONS_SENT_AVATAR_CAP / NEWLY_CONNECTED_PEOPLE_CAP /
 * ENRICHED_PEOPLE_CAP on the backend), this cap is just about not
 * overflowing a narrow feed row.
 *
 * `onSelect(person)` is optional. When passed, each face becomes its own
 * button — a click on ONE person's photo should go to THAT person, not
 * wherever the feed row's own click goes (e.g. connections_sent's row opens
 * the campaign; the avatar itself has no more specific place to send you,
 * so that type never passes onSelect). Every click here calls
 * `stopPropagation`, since the caller (FeedRow) wraps the whole row in its
 * own click handler.
 */
const STACK_CAP = 5;

export function AvatarStack({ people = [], size = 20, onSelect }) {
  if (!people.length) return null;
  const shown = people.slice(0, STACK_CAP);
  const overflow = people.length - shown.length;
  const overlap = -Math.round(size * 0.35);

  return (
    <span className="flex items-center mt-1.5">
      {shown.map((person, i) => {
        const clickable = Boolean(onSelect && (person.hubLeadId || person.profileUrl));
        const face = <Avatar src={person.profilePictureUrl || null} name={person.name} size={size} />;
        return (
          <span
            key={person.hubLeadId || person.profileUrl || person.name || i}
            className="block rounded-full shrink-0"
            style={{
              marginLeft: i === 0 ? 0 : overlap,
              zIndex: shown.length - i,
              boxShadow: '0 0 0 2px var(--ui-surface-card)',
            }}
          >
            {clickable ? (
              // Not <Button>/<IconButton>: this must be a bare 20px circle
              // matching Avatar's own sizing exactly, with zero built-in
              // padding/min-height — the primitives' own height floor would
              // break the overlapping-stack layout above.
              // eslint-disable-next-line no-restricted-syntax
              <button
                type="button"
                title={person.name || undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(person);
                }}
                className="block rounded-full focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
              >
                {face}
              </button>
            ) : (
              <span aria-hidden="true">{face}</span>
            )}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          aria-hidden="true"
          className="grid place-items-center rounded-full text-[length:var(--ui-t-micro)] font-medium shrink-0"
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
