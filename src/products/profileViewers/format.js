/**
 * How long ago a viewer looked, said honestly.
 *
 * LinkedIn only ever says "Viewed 5h ago", so the stored time is a derived
 * estimate good to the unit it came from. Everything here is therefore "about":
 * "about 5 hours ago", "about 2 weeks ago". The unit follows how long ago it
 * really is now (a viewer stored 5 hours ago reads "about 1 day ago" a day
 * later) but is never finer than the stored precision.
 */

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

const ORDER = ['hour', 'day', 'week', 'month'];
const SIZE = { hour: HOUR, day: DAY, week: WEEK, month: MONTH };
const UNIT_WORD = { hour: 'hour', day: 'day', week: 'week', month: 'month' };
const SHORT_TO_UNIT = { h: 'hour', d: 'day', w: 'week', mo: 'month' };

const phrase = (count, unit) => {
  if (count <= 1) return `about ${unit === 'hour' ? 'an' : 'a'} ${UNIT_WORD[unit]} ago`;
  return `about ${count} ${UNIT_WORD[unit]}s ago`;
};

function unitFor(diffMs, precision) {
  let unit = 'hour';
  if (diffMs >= 24 * HOUR) unit = 'day';
  if (diffMs >= 2 * WEEK) unit = 'week';
  if (diffMs >= 8 * WEEK) unit = 'month';
  const floor = ORDER.indexOf(precision);
  return floor > ORDER.indexOf(unit) ? precision : unit;
}

/** "about 5 hours ago" for a stored `lastViewedAt` and its precision. */
export function formatViewed(lastViewedAt, precision, now = Date.now()) {
  if (!lastViewedAt || !ORDER.includes(precision)) return 'recently';
  const time = new Date(lastViewedAt).getTime();
  if (!Number.isFinite(time)) return 'recently';
  const diff = Math.max(0, now - time);
  const unit = unitFor(diff, precision);
  return phrase(Math.round(diff / SIZE[unit]), unit);
}

/** The same for a private viewer's `{ value, unit }` reading, as LinkedIn gave it ("1d" -> "about a day ago"). */
export function formatViewedAgo(viewedAgo) {
  const unit = SHORT_TO_UNIT[viewedAgo?.unit];
  if (!unit || !Number.isFinite(viewedAgo?.value)) return '';
  return phrase(viewedAgo.value, unit);
}
