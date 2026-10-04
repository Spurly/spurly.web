/** Shared number/date formatting for the chart kit. */

export const fmtNum = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString() : '—');

export const fmtPct = (n) => (Number.isFinite(n) ? `${n % 1 === 0 ? n : n.toFixed(1)}%` : '—');

/** "2026-10-04" -> "Oct 4". Noon avoids a timezone edge flipping the day. */
export function shortDay(key) {
  const d = new Date(`${key}T12:00:00`);
  return Number.isNaN(d.getTime()) ? String(key) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function longDay(key) {
  const d = new Date(`${key}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? String(key)
    : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export const sumOf = (values) => (Array.isArray(values) ? values.reduce((a, b) => a + (Number(b) || 0), 0) : 0);

export const hasData = (values) => Array.isArray(values) && values.some((v) => Number(v) > 0);

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function hourLabel(h) {
  const suffix = h < 12 ? 'AM' : 'PM';
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base} ${suffix}`;
}
