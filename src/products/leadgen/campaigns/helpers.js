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

export const STATUS_STYLES = {
  draft: { label: 'Draft', bg: 'var(--surface-sunken)', color: 'var(--text-tertiary)' },
  active: { label: 'Active', bg: 'var(--green-tint)', color: 'var(--green)' },
  paused: { label: 'Paused', bg: 'var(--accent-tint)', color: 'var(--brand-purple)' },
  completed: { label: 'Completed', bg: 'rgba(6,182,212,0.12)', color: '#0891b2' },
};

export const ACTION_LABELS = {
  connection: 'Connection request',
  message: 'Message',
};
