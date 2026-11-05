/**
 * Colour by what a step does, so a long flow reads at a glance: reaching out is accent, light engagement is green,
 * waiting and reading are neutral, and anything that forks the flow is amber.
 */
const GROUPS = {
  accent: ['connect', 'message', 'inmail'],
  success: ['profile_visit', 'like_post', 'comment_post', 'follow', 'endorse_skill'],
  neutral: ['wait', 'check_recent_posts'],
  warning: ['condition', 'wait_for', 'split'],
};

const TILES = {
  accent: 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]',
  success: 'bg-[var(--ui-success-tint)] text-[var(--ui-success-fg)]',
  neutral: 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)]',
  warning: 'bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]',
  danger: 'bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)]',
};

export const toneOf = (type) => Object.keys(GROUPS).find((tone) => GROUPS[tone].includes(type)) ?? 'neutral';
export const tileClass = (type) => TILES[toneOf(type)];
export const terminalTile = (kind) => (kind === 'stop' ? TILES.danger : TILES.accent);
