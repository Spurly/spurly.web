/** Relative "time ago" like lemlist ("23 hr. ago", "1 day ago"). */
export function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;

  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? '' : 's'} ago`;
}

/*
 * Every stop is a token, including `completed`.
 *
 * It used to be a literal rgba tint with a #0891b2 teal on top — a colour
 * from a palette this app stopped using. In light mode it merely looked
 * foreign; in dark mode a translucent light tint over a dark card mixes to
 * near-black and dark teal text on it is unreadable. Tinted lozenge plus
 * `-fg` text is the pattern every other status in the product uses.
 *
 * `active` and `paused` also move off the `-fill` stops onto `-fg`: the
 * fill stops are sized for white text sitting ON them, not for text sitting
 * on their tint, which is what these actually are.
 */
export const STATUS_STYLES = {
  draft: { label: 'Draft', bg: 'var(--ui-surface-sunken)', color: 'var(--ui-text-tertiary)' },
  active: { label: 'Active', bg: 'var(--ui-success-tint)', color: 'var(--ui-success-fg)' },
  paused: { label: 'Paused', bg: 'var(--ui-warning-tint)', color: 'var(--ui-warning-fg)' },
  completed: { label: 'Completed', bg: 'var(--ui-accent-tint)', color: 'var(--ui-accent-fg)' },
};

export const ACTION_LABELS = {
  connection: 'Connection request',
  message: 'Message',
};
