/**
 * Button appearance, isolated from behaviour.
 *
 * Direction A rules, deliberate and enforced here rather than per call site:
 *   - no transform on hover (no lift), no coloured shadow
 *   - background change only, at --ui-dur-fast
 *   - font-medium, never semibold
 *   - radius 6-8px
 *   - heights 28 / 32 / 36
 */

export const SIZES = {
  sm: 'h-7 px-2.5 text-[12.5px] gap-1.5 rounded-[var(--ui-radius-sm)]',
  md: 'h-8 px-3 text-[13px] gap-1.5 rounded-[var(--ui-radius-sm)]',
  lg: 'h-9 px-3.5 text-[13.5px] gap-2 rounded-[var(--ui-radius-md)]',
};

export const ICON_SIZE = { sm: 14, md: 15, lg: 16 };

export const VARIANTS = {
  /* The single dominant action on a screen. Near-black, not brand.
     Hover adds a soft halo rather than changing hue — a near-black button has
     nowhere darker to go, so depth has to carry the feedback. */
  primary:
    'bg-[var(--ui-ink)] text-[var(--ui-text-inverse)] hover:bg-[var(--ui-ink-hover)] ' +
    'hover:shadow-[0_0_0_3px_var(--ui-ink-halo)] active:bg-[var(--ui-ink)]',

  /* Default for almost everything. Surface + hairline.
     Hover picks up the accent on the border and text before the fill, so the
     control answers the cursor without becoming a coloured button. */
  secondary:
    'bg-[var(--ui-surface-card)] text-[var(--ui-text-primary)] border border-[var(--ui-border)] ' +
    'hover:bg-[var(--ui-accent-tint)] hover:border-[var(--ui-accent-border)] ' +
    'hover:text-[var(--ui-accent-fg)] active:bg-[var(--ui-accent-tint-strong)]',

  /* Toolbar actions, table controls, anything that should recede. */
  ghost:
    'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] ' +
    'hover:text-[var(--ui-text-primary)] active:bg-[var(--ui-surface-active)]',

  /* Signal only. Reserve for actions that genuinely are the brand action. */
  accent:
    'bg-[var(--ui-accent)] text-white hover:bg-[var(--ui-accent-hover)] ' +
    'hover:shadow-[0_0_0_3px_var(--ui-accent-tint-strong)]',

  /* Quiet accent — accent meaning without accent weight. */
  accentSoft:
    'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] ' +
    'hover:bg-[var(--ui-accent-tint-strong)]',

  danger:
    'bg-[var(--ui-danger)] text-white hover:brightness-110',

  dangerSoft:
    'bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)] hover:brightness-95',
};

export const BASE =
  'inline-flex items-center justify-center font-medium whitespace-nowrap select-none ' +
  'tracking-[-0.005em] cursor-pointer ' +
  'transition-[background-color,border-color,color] duration-[var(--ui-dur-fast)] ' +
  'ease-[cubic-bezier(0.2,0,0.1,1)] ' +
  'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] ' +
  'disabled:opacity-45 disabled:pointer-events-none';
