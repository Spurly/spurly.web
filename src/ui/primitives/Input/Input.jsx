import { forwardRef } from 'react';

const SIZES = {
  sm: 'h-7 text-[12px]',
  md: 'h-8 text-[13px]',
  lg: 'h-9 text-[13px]',
};

/**
 * Text input. Handles the leading/trailing adornment case directly so pages
 * never hand-roll an absolutely positioned icon over a bare <input> — which is
 * what the old table toolbar did.
 */
export const Input = forwardRef(function Input(
  {
    size = 'md',
    leadingIcon = null,
    trailingSlot = null,
    invalid = false,
    fullWidth = false,
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
          className="absolute left-2.5 grid place-items-center pointer-events-none text-[var(--ui-text-tertiary)]"
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
          'placeholder:text-[var(--ui-text-tertiary)]',
          'border rounded-[var(--ui-radius-sm)]',
          invalid ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
          'transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] ease-[cubic-bezier(0.2,0,0.1,1)]',
          'hover:border-[var(--ui-border-strong)]',
          'focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[0_0_0_3px_var(--ui-accent-tint)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          SIZES[size] ?? SIZES.md,
          leadingIcon ? 'pl-8' : 'pl-2.5',
          trailingSlot ? 'pr-8' : 'pr-2.5',
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />

      {trailingSlot && <span className="absolute right-1.5 flex items-center">{trailingSlot}</span>}
    </div>
  );
});
