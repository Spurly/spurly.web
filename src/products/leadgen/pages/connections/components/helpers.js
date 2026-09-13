/**
 * One sentence for what a connections sync actually changed.
 *
 * Two counts come back from the sweep and conflating them was a bug:
 *
 *   newConnections — people now in the roster who weren't before. Covers every
 *                    route in: they accepted your invite, they invited you, or
 *                    you connected outside Spurly entirely.
 *   degreesUpdated — outbound Spurly invites reconciled to accepted. A strict
 *                    subset of the above.
 *
 * The page used to report `degreesUpdated` alone, so a sync that had just added
 * someone who invited *you* still said "no newly accepted requests" — literally
 * true, and completely misleading.
 *
 * Leads with the count that covers every route, mentions accepted invites when
 * there are any, and only claims "up to date" when both are genuinely zero.
 *
 * @param {{ newConnections?: number, degreesUpdated?: number }} result
 * @returns {string}
 */
export function describeSyncResult({ newConnections = 0, degreesUpdated = 0 } = {}) {
  const added =
    newConnections > 0
      ? `${newConnections.toLocaleString()} new connection${newConnections === 1 ? '' : 's'}`
      : null;
  const accepted =
    degreesUpdated > 0
      ? `${degreesUpdated.toLocaleString()} invite${degreesUpdated === 1 ? '' : 's'} accepted`
      : null;

  if (added && accepted) return `${added} · ${accepted}`;
  if (added) return added;
  /* Reachable on its own: an invite can reconcile to accepted for someone
     already in the roster from an earlier sweep. */
  if (accepted) return accepted;
  return 'Up to date — no new connections';
}
