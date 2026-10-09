const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days left until `end` (rounded up; 0 once it is today or past). */
export function trialDaysLeft(end, now = Date.now()) {
  const ms = new Date(end).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / DAY_MS);
}
