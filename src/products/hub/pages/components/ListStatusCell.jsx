import { Badge } from 'src/ui/primitives';

/**
 * The status cell shared by the campaigns and sequences lists.
 *
 * `minimal` here, not the tinted badge the DETAIL pages use: a column of
 * tinted lozenges is a wall of pastel, while a coloured dot lets the eye find
 * the exceptions in a long list. Same badge, different job — see Badge.jsx.
 *
 * The pause REASON sits beside it rather than in a column of its own. It is
 * empty on almost every row (a column that is blank 95% of the time is worse
 * than no column, per the leads table's note), and "Paused" with no reason is
 * the one status a user cannot act on.
 */

/** Why the server stopped something on its own. Identical for campaigns and
 *  sequences because the backend emits the same three reasons for both. */
const PAUSED_REASON = {
  account: 'LinkedIn needs reconnecting',
  breaker: 'stopped after repeated failures',
  entitlement: 'plan no longer includes Hub',
};

export function ListStatusCell({ view, running = false, pausedReason }) {
  const reason = PAUSED_REASON[pausedReason];

  return (
    <span className="flex items-center gap-2 min-w-0">
      <Badge variant="minimal" tone={view.tone} dot pulse={running} title={view.detail}>
        {view.label}
      </Badge>
      {reason && (
        <span className="truncate text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)]" title={reason}>
          {reason}
        </span>
      )}
    </span>
  );
}

export default ListStatusCell;
