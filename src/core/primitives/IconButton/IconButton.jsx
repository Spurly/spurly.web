import { BASE, VARIANTS } from '../Button/variants';

const SQUARE = {
  sm: 'w-7 h-7 rounded-[var(--ui-radius-sm)]',
  md: 'w-8 h-8 rounded-[var(--ui-radius-sm)]',
  lg: 'w-9 h-9 rounded-[var(--ui-radius-md)]',
};

/**
 * A button whose entire content is one icon.
 *
 * `label` is required and becomes aria-label — an icon-only control with no
 * accessible name is invisible to screen readers, and it is the single most
 * common a11y bug in dense toolbars.
 */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={[BASE, SQUARE[size] ?? SQUARE.md, VARIANTS[variant] ?? VARIANTS.ghost, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span aria-hidden="true" className="grid place-items-center">
        {icon}
      </span>
    </button>
  );
}
