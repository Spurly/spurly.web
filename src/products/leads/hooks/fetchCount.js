/**
 * "Profiles to fetch" helpers — pure, and in their own file for the same
 * react-refresh reason as audience.js: the dialogs that use them are
 * components, and a module exporting both loses fast refresh.
 */

/** The server's per-fetch max, or the plan default before usage has loaded. */
export function perFetchMax(usage) {
  const n = Number(usage?.limits?.perFetch);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

/** Why a count is not acceptable, or null. Pure; exported for tests. */
export function fetchCountProblem(value, max) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Enter how many profiles to fetch.';
  if (!/^\d+$/.test(raw)) return 'Use a whole number.';
  const n = Number(raw);
  if (n < 1) return 'Fetch at least 1 profile.';
  if (n > max) return `You can fetch at most ${max} profiles at a time.`;
  return null;
}

/** "320 of 1,000 left today" — or null when there is nothing useful to say. */
export function budgetLine(usage) {
  if (!usage?.limits) return null;
  const today = `${(usage.remainingToday ?? 0).toLocaleString()} of ${usage.limits.perDay.toLocaleString()} left today`;
  const month = `${(usage.remainingThisMonth ?? 0).toLocaleString()} this month`;
  return `${today} · ${month}`;
}
