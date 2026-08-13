/**
 * Formatting for DAY-GRANULAR dates.
 *
 * Separate from the helpers in ./outreach.js on purpose: those format precise
 * instants ("3d ago", "Aug 10, 2026, 2:15 PM"), which is right for a send that
 * happened at a moment in time. A connection date has no time — LinkedIn only
 * tells us "Connected on August 10, 2026" — so it's stored at UTC midnight and
 * must be rendered as a plain calendar date.
 */

/**
 * "10 Aug 2026". Formatted in UTC, deliberately.
 *
 * The value is UTC midnight, so formatting it in the browser's local zone would
 * render the PREVIOUS day for anyone west of UTC — a user in New York would see
 * every connection dated a day early. Pinning the timezone is what keeps the
 * displayed date identical to the one LinkedIn showed.
 *
 * @param {string|Date|null} value
 * @returns {string} '' when there's no usable date, so callers can fall back.
 */
export function calendarDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Approximate age of a day-granular date — "today", "3d", "2mo".
 *
 * Computed from whole UTC days rather than elapsed milliseconds: the stored
 * value is midnight, so a millisecond diff would report a connection made this
 * morning as "1d ago" at any local time past midnight UTC.
 *
 * @param {string|Date|null} value
 * @returns {string} '' when there's no usable date.
 */
export function calendarAge(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const startOfUtcDay = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const days = Math.floor((startOfUtcDay(new Date()) - startOfUtcDay(date)) / 86400000);

  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d`;
  if (days < 31) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}
