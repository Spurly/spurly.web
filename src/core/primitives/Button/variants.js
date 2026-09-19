/**
 * Button appearance, isolated from behaviour.
 *
 * v2 rules, enforced here rather than per call site:
 *   - no transform on hover, no coloured shadow-glow. A console's
 *     controls change state; they don't animate at you.
 *   - background change only, at --ui-dur-fast
 *   - font-semibold (--ui-w-strong). v1 banned it and ran two weights,
 *     which left a 32px button and its page title at the same weight.
 *   - radius 8 / 10
 *   - heights 32 / 38 / 44
 *
 * The one discipline that carries over from v1: ONE accent-filled button
 * per screen. Purple leads now — it is the primary fill, not a signal
 * reserved for nav — and that only means anything while it stays rare.
 * Everything else on a screen is secondary, ghost or soft.
 */

export const SIZES = {
  sm: 'h-8 px-3 text-[length:var(--ui-t-body)] gap-1.5 rounded-[var(--ui-radius-sm)]',
  // v3: 9px, not the 12px panel radius --ui-radius-md now carries — buttons
  // get their own step (--ui-radius-btn) between small controls and panels.
  md: 'h-[38px] px-4 text-[length:var(--ui-t-body)] gap-2 rounded-[var(--ui-radius-btn)]',
  lg: 'h-11 px-5 text-[length:var(--ui-t-body)] gap-2 rounded-[var(--ui-radius-btn)]',
};

export const ICON_SIZE = { sm: 13, md: 14, lg: 16 };

export const VARIANTS = {
  /* The single dominant action on a screen.
     --ui-accent-on rather than a literal white: in a future high-contrast
     or light-accent theme the text on the fill has to move with it, and a
     hardcoded white is exactly the pairing that produced the white-on-white
     bug in /admin. */
  // v3: a composite shadow rather than a flat fill — a hairline of deep
  // blue, a dark bottom lip, a light top highlight, and the drop shadow
  // only on hover, so the button lifts toward the cursor rather than
  // floating permanently. See --ui-btn-shadow in tokens.css.
  primary:
    'bg-[var(--ui-accent)] text-[var(--ui-accent-on)] hover:bg-[var(--ui-accent-hover)] ' +
    'active:bg-[var(--ui-accent)] shadow-[var(--ui-btn-shadow)] hover:shadow-[var(--ui-btn-shadow-hover)]',

  /* Kept as a distinct name because ~30 call sites ask for it. It resolves
     to primary now: under v1 `accent` was the brand-coloured exception and
     `primary` was near-black, and v2 inverts that. Rather than rewrite every
     call site to say `primary` — a diff with no reader — the two names agree. */
  accent:
    'bg-[var(--ui-accent)] text-[var(--ui-accent-on)] hover:bg-[var(--ui-accent-hover)] ' +
    'active:bg-[var(--ui-accent)] shadow-[var(--ui-btn-shadow)] hover:shadow-[var(--ui-btn-shadow-hover)]',

  /* Default for almost everything. Surface + hairline.
     Hover picks up the accent on the border and text before the fill, so the
     control answers the cursor without becoming a second primary button. */
  secondary:
    'bg-[var(--ui-surface-card)] text-[var(--ui-text-body)] border border-[var(--ui-border)] ' +
    'hover:border-[var(--ui-accent-border)] hover:text-[var(--ui-text-primary)] hover:shadow-[var(--ui-hover-ring)] ' +
    'active:bg-[var(--ui-surface-hover)]',

  /* The accent-outlined secondary ("Draft openers", "Rewrite"): an action
     Spurly itself performs, so it carries the accent without being a fill. */
  accentOutline:
    'bg-[var(--ui-surface-card)] text-[var(--ui-accent-fg)] border border-[var(--ui-accent-border)] ' +
    'hover:bg-[var(--ui-accent-tint)] active:bg-[var(--ui-accent-tint-strong)]',

  /* Toolbar actions, table controls, anything that should recede. */
  ghost:
    'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-rail-hover)] ' +
    'hover:text-[var(--ui-text-primary)] active:bg-[var(--ui-surface-active)]',

  /* Accent meaning without accent weight. A second-rank action that is still
     clearly part of the same flow as the primary one. */
  accentSoft:
    'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] ' +
    'hover:bg-[var(--ui-accent-tint-strong)]',

  /* Near-black. Demoted in v2 from "the primary button" to "the rare second
     heavy action", for the screen that genuinely needs two without putting
     two purple fills side by side and making neither of them the answer. */
  ink:
    'bg-[var(--ui-ink)] text-[var(--ui-text-inverse)] hover:bg-[var(--ui-ink-hover)]',

  danger:
    'bg-[var(--ui-danger)] text-white hover:bg-[var(--ui-danger-fg)]',

  dangerSoft:
    'bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)] ' +
    'hover:bg-[var(--ui-danger)] hover:text-white',

  /* Inline, inside prose. No height, no padding to speak of — it is a link
     that happens to be a <button> because it does something rather than
     going somewhere. */
  link:
    'text-[var(--ui-accent-fg)] hover:underline px-0.5',
};

export const BASE =
  'inline-flex items-center justify-center font-medium whitespace-nowrap select-none ' +
  'tracking-[-0.008em] cursor-pointer border border-transparent ' +
  'transition-[background-color,border-color,color,box-shadow] duration-[var(--ui-dur-fast)] ' +
  'ease-[cubic-bezier(0.2,0,0.1,1)] ' +
  'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] ' +
  'disabled:opacity-[0.42] disabled:pointer-events-none';
