/**
 * Outreach display helpers.
 *
 * `Person.outreach` is a rollup the backend derives from the append-only
 * OutreachEvent log (see spurly.backend/src/features/outreach). Everything the
 * People table, filter chips and activity drawer render comes from here so the
 * vocabulary stays identical across the app.
 */

/**
 * Overall status meta, in funnel order: none -> invited -> connected ->
 * messaged. The pill shows the FURTHEST step reached, so 'messaged' outranks
 * 'connected' — once you've DM'd someone, that they accepted is old news.
 *
 * Four of the five describe something the USER did. 'connected' is the one
 * exception, and it's earned: the connections sweep reads LinkedIn's own list
 * of your connections, so a 1st-degree row is observed, not inferred from an
 * invite going out. There is still no 'replied' state — the product never sees
 * the recipient's side of a message, so that one would be a guess dressed up
 * as a fact.
 *
 * 'connected' is the only success tone in the set. That's the point: it's the
 * one row state that means something went right without further work from you,
 * so green should be scannable down a long list.
 */
export const OUTREACH_STATUS_META = {
  none: { label: 'Not contacted', tone: 'neutral', short: 'Not contacted' },
  invited: { label: 'Connection sent', tone: 'warning', short: 'Connection sent' },
  connected: { label: 'Connected', tone: 'success', short: 'Connected' },
  messaged: { label: 'Message sent', tone: 'primary', short: 'Message sent' },
  failed: { label: 'Failed', tone: 'danger', short: 'Failed' },
};

/**
 * The filter chips shown above the People table.
 *
 * 'failed' is deliberately absent: it IS written, but a permanent "0" chip is
 * noise on a healthy account. It's surfaced instead as a conditional alert in
 * OutreachFilterBar that only appears when there's something to act on.
 * Filtering by `outreachStatus=failed` still works server-side.
 */
export const OUTREACH_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'none', label: 'Not contacted' },
  { id: 'invited', label: 'Connection sent' },
  { id: 'connected', label: 'Connected' },
  { id: 'messaged', label: 'Message sent' },
];

/** Per-event meta for the activity timeline. */
export const OUTREACH_EVENT_META = {
  sent: { label: 'Sent', tone: 'primary' },
  failed: { label: 'Failed', tone: 'danger' },
  skipped: { label: 'Skipped', tone: 'neutral' },
};

export const OUTREACH_TYPE_LABEL = {
  connection: 'Connection request',
  message: 'Message',
};

/** Safely read the rollup off a Profile entity or a raw person row. */
export function getOutreach(row) {
  return row?.outreach ?? row?.raw?.outreach ?? null;
}

/**
 * Compact relative time — "3d", "5h", "2w". Returns '' for a missing date.
 * Deliberately terse: it lives inside a status pill.
 */
export function relativeTime(value) {
  if (!value) return '';
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return '';

  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}

/** Full, unambiguous timestamp for tooltips and the activity drawer. */
export function absoluteTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Build everything the status pill needs from a rollup.
 *
 * @param {Object} outreach - the Person.outreach rollup
 * @param {Object} [person] - the surrounding row, for fields that live on the
 *   Person rather than inside the rollup. `connectedAt` is the only one today:
 *   it's written by the connections sweep next to `connectionDegree`, so a
 *   'connected' pill has no date unless the caller passes the row through.
 * @returns {{ status, label, tone, when, title }}
 */
export function describeOutreach(outreach, { connectedAt } = {}) {
  const status = outreach?.status || 'none';
  const meta = OUTREACH_STATUS_META[status] || OUTREACH_STATUS_META.none;

  const connection = outreach?.connection || {};
  const message = outreach?.message || {};

  // Which date belongs next to this label.
  let when = null;
  if (status === 'messaged') when = message.lastSentAt;
  // Acceptance date, not invite date — "Connected · 2d" answers "how fresh is
  // this connection", which is what you act on. Falls back to the invite when
  // LinkedIn's list had no readable "Connected on" line.
  else if (status === 'connected') when = connectedAt || connection.lastSentAt;
  else if (status === 'invited') when = connection.lastSentAt;

  // "Message sent 2×" — the repeat count is the whole reason a single date
  // column isn't enough, so surface it.
  let label = meta.label;
  if (status === 'messaged' && message.count > 1) label = `Message sent ${message.count}×`;

  const titleParts = [];
  if (connection.count > 0) {
    titleParts.push(
      `${connection.count} connection request${connection.count === 1 ? '' : 's'}` +
        (connection.lastSentAt ? ` · last ${absoluteTime(connection.lastSentAt)}` : ''),
    );
  }
  if (message.count > 0) {
    titleParts.push(
      `${message.count} message${message.count === 1 ? '' : 's'}` +
        (message.lastSentAt ? ` · last ${absoluteTime(message.lastSentAt)}` : ''),
    );
  }
  if (status === 'connected' && connectedAt) {
    titleParts.push(`Connected ${absoluteTime(connectedAt)}`);
  }

  const lastError = connection.lastError || message.lastError;
  if (status === 'failed' && lastError) titleParts.push(lastError);

  return {
    status,
    label,
    tone: meta.tone,
    when,
    relative: relativeTime(when),
    title: titleParts.length ? titleParts.join('\n') : meta.label,
  };
}

/** Has this person been successfully contacted at least once? */
export function isContacted(row) {
  return Boolean(getOutreach(row)?.lastTouchedAt);
}
