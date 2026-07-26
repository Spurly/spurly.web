/**
 * Outreach display helpers.
 *
 * `Person.outreach` is a rollup the backend derives from the append-only
 * OutreachEvent log (see spurly.backend/src/features/outreach). Everything the
 * People table, filter chips and activity drawer render comes from here so the
 * vocabulary stays identical across the app.
 */

/**
 * Overall status meta, ordered as the outreach funnel:
 * not contacted -> invite sent -> connected -> messaged -> replied.
 *
 * `replied` is kept here (not in OUTREACH_FILTERS) so that if a reply event is
 * ever recorded the pill and timeline render it correctly — it just isn't
 * offered as a filter while nothing can produce it.
 */
export const OUTREACH_STATUS_META = {
  none: { label: 'Not contacted', tone: 'neutral', short: 'Not contacted' },
  invited: { label: 'Invite sent', tone: 'warning', short: 'Invited' },
  connected: { label: 'Connected', tone: 'info', short: 'Connected' },
  messaged: { label: 'Messaged', tone: 'primary', short: 'Messaged' },
  replied: { label: 'Replied', tone: 'success', short: 'Replied' },
  failed: { label: 'Failed', tone: 'danger', short: 'Failed' },
};

/**
 * The filter chips shown above the People table, in funnel order.
 *
 * Two statuses are deliberately absent:
 *
 * - 'replied' — fully supported end-to-end (schema, rollup precedence, pill,
 *   timeline) but nothing WRITES it yet: LinkedIn's messaging inbox exposes
 *   thread IDs rather than profile URLs, so reply detection isn't built. A chip
 *   that can only ever read 0 is worse than no chip. Add it back the moment
 *   something emits a `replied` event — no migration needed.
 *
 * - 'failed' — this one IS written, but a permanent "0" chip is noise. It's
 *   surfaced instead as a conditional alert in OutreachFilterBar that only
 *   appears when there's something to act on. Filtering by `outreachStatus=failed`
 *   still works server-side; it's just not a always-on chip.
 */
export const OUTREACH_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'none', label: 'Not contacted' },
  { id: 'invited', label: 'Invite sent' },
  { id: 'connected', label: 'Connected' },
  { id: 'messaged', label: 'Messaged' },
];

/** Per-event meta for the activity timeline. */
export const OUTREACH_EVENT_META = {
  sent: { label: 'Sent', tone: 'primary' },
  accepted: { label: 'Accepted', tone: 'success' },
  replied: { label: 'Replied', tone: 'success' },
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
 * @returns {{ status, label, tone, when, title }}
 */
export function describeOutreach(outreach) {
  const status = outreach?.status || 'none';
  const meta = OUTREACH_STATUS_META[status] || OUTREACH_STATUS_META.none;

  const connection = outreach?.connection || {};
  const message = outreach?.message || {};

  // Which date belongs next to this label.
  let when = null;
  if (status === 'replied') when = outreach?.repliedAt || message.lastSentAt;
  else if (status === 'messaged') when = message.lastSentAt;
  else if (status === 'connected') when = outreach?.lastTouchedAt || connection.lastSentAt;
  else if (status === 'invited') when = connection.lastSentAt;

  // "Messaged 2×" — the repeat count is the whole reason a single date column
  // isn't enough, so surface it.
  let label = meta.label;
  if (status === 'messaged' && message.count > 1) label = `Messaged ${message.count}×`;

  const titleParts = [];
  if (connection.count > 0) {
    titleParts.push(
      `${connection.count} connection request${connection.count === 1 ? '' : 's'}` +
        (connection.lastSentAt ? ` · last ${absoluteTime(connection.lastSentAt)}` : ''),
    );
  }
  if (connection.status === 'accepted') titleParts.push('Connection accepted');
  if (message.count > 0) {
    titleParts.push(
      `${message.count} message${message.count === 1 ? '' : 's'}` +
        (message.lastSentAt ? ` · last ${absoluteTime(message.lastSentAt)}` : ''),
    );
  }
  if (outreach?.repliedAt) titleParts.push(`Replied ${absoluteTime(outreach.repliedAt)}`);
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
