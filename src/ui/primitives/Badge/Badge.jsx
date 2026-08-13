const TINT = {
  neutral: 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)]',
  accent:  'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]',
  success: 'bg-[var(--ui-success-tint)] text-[var(--ui-success-fg)]',
  warning: 'bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]',
  danger:  'bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)]',
  info:    'bg-[var(--ui-info-tint)] text-[var(--ui-info-fg)]',
};
/* Legacy aliases from the old Badge, which used `variant` for the hue. */
TINT.primary = TINT.accent; TINT.default = TINT.neutral; TINT.error = TINT.danger;

const SOLID = {
  neutral: 'bg-[var(--ui-neutral-700)] text-[var(--ui-surface-card)]',
  accent:  'bg-[var(--ui-accent)] text-white',
  success: 'bg-[var(--ui-success)] text-white',
  warning: 'bg-[var(--ui-warning)] text-white',
  danger:  'bg-[var(--ui-danger)] text-white',
  info:    'bg-[var(--ui-info)] text-white',
};
SOLID.primary = SOLID.accent; SOLID.default = SOLID.neutral; SOLID.error = SOLID.danger;

const DOT = {
  neutral: 'bg-[var(--ui-text-tertiary)]',
  accent:  'bg-[var(--ui-accent-dot)]',
  success: 'bg-[var(--ui-success-dot)]',
  warning: 'bg-[var(--ui-warning-dot)]',
  danger:  'bg-[var(--ui-danger-dot)]',
  info:    'bg-[var(--ui-info-dot)]',
};
DOT.primary = DOT.accent; DOT.default = DOT.neutral; DOT.error = DOT.danger;

const SIZES = {
  sm: 'h-[18px] text-[11px] gap-1',
  md: 'h-[20px] text-[11.5px] gap-1.5',
};

const PAD = { sm: 'px-1.5', md: 'px-2' };

/**
 * Status label.
 *
 * Three variants, and the default is deliberately the quietest:
 *
 *   minimal — a coloured dot and neutral text, no fill. This is what a table
 *             of 100 rows wants: colour appears as a 6px dot rather than 100
 *             tinted lozenges, so the eye finds the exceptions instead of
 *             swimming in pastel. Linear and Attio both land here.
 *   tint    — light fill, darker text of the same hue. For a single status on
 *             a detail page, where one badge should carry weight.
 *   solid   — saturated fill. Counts and alerts only.
 */
export function Badge({
  children,
  tone = 'neutral',
  variant = 'tint',
  size = 'md',
  dot = false,
  pulse = false,
  pill = false,
  title,
  className = '',
}) {
  /* The old Badge passed the hue as `variant`. If we get a hue there, treat it
     as the tone so legacy call sites keep their colour. */
  const isStyleVariant = variant === 'minimal' || variant === 'tint' || variant === 'solid';
  const hue = isStyleVariant ? tone : variant || tone;
  const minimal = variant === 'minimal';

  const palette =
    variant === 'solid' ? SOLID[hue] ?? SOLID.neutral
      : minimal ? 'text-[var(--ui-text-secondary)]'
      : TINT[hue] ?? TINT.neutral;

  return (
    <span
      title={title}
      className={[
        'inline-flex items-center font-medium whitespace-nowrap max-w-full',
        SIZES[size] ?? SIZES.md,
        minimal ? '' : PAD[size] ?? PAD.md,
        minimal ? '' : pill ? 'rounded-[var(--ui-radius-pill)]' : 'rounded-[var(--ui-radius-xs)]',
        palette,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        /* A pulsing dot distinguishes "working" from "finished". Opacity only —
           animating size would reflow every row it sits in. */
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[hue] ?? DOT.neutral} ${
            pulse ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}
