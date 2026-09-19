import { forwardRef } from 'react';

/* Heights match Button's, so an input and the button beside it in a toolbar
   agree. They previously ran 28/32/36 against Button's 32/40/48, which is
   why every search-box-plus-button row sat a few pixels out of true. */
const SIZES = {
  sm: 'h-[var(--ui-ctl-h)] text-[length:var(--ui-t-control)] rounded-[var(--ui-radius-sm)]',
  md: 'h-[var(--ui-ctl-h-lg)] text-[length:var(--ui-t-body)] rounded-[var(--ui-radius-btn)]',
  lg: 'h-11 text-[length:var(--ui-t-body)] rounded-[var(--ui-radius-btn)]',
};

/**
 * Text input. Handles the leading/trailing adornment case directly so pages
 * never hand-roll an absolutely positioned icon over a bare <input> — which
 * is what the old table toolbar did.
 *
 * Focus is a 1px accent border plus a 3px tint halo rather than an outline:
 * an outline is clipped by the overflow on a table cell or a dock sheet,
 * and a box-shadow is not.
 */
export const Input = forwardRef(function Input(
  {
    size = 'md',
    leadingIcon = null,
    trailingSlot = null,
    invalid = false,
    fullWidth = false,
    mono = false,
    className = '',
    ...rest
  },
  ref,
) {
  return (
    <div
      className={[
        'relative inline-flex items-center',
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {leadingIcon && (
        <span
          className={`absolute ${size === 'sm' ? 'left-2.5' : 'left-3'} grid place-items-center pointer-events-none text-[var(--ui-neutral-400)]`}
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      )}

      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={[
          'w-full bg-[var(--ui-surface-card)] text-[var(--ui-text-primary)]',
          'placeholder:text-[var(--ui-text-quaternary)]',
          'border', // radius comes with the size step, same as Button
          /* An input that takes a URL, an id or a figure is reporting a
             reading, not prose, and reads far better in the mono face. */
          mono ? 'font-[family-name:var(--ui-font-mono)]' : '',
          invalid ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
          'transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] ease-[cubic-bezier(0.2,0,0.1,1)]',
          'hover:border-[var(--ui-border-strong)]',
          'focus:outline-none focus:border-[var(--ui-accent)]',
          invalid
            ? 'focus:shadow-[0_0_0_3px_var(--ui-danger-tint)]'
            : 'focus:shadow-[var(--ui-focus-ring)]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--ui-surface-sunken)]',
          SIZES[size] ?? SIZES.md,
          leadingIcon ? (size === 'sm' ? 'pl-[30px]' : 'pl-9') : 'pl-3',
          trailingSlot ? 'pr-9' : 'pr-3',
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />

      {trailingSlot && <span className="absolute right-2 flex items-center">{trailingSlot}</span>}
    </div>
  );
});
