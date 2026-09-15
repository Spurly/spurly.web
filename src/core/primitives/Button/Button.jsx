import { BASE, SIZES, VARIANTS, ICON_SIZE } from './variants';

/**
 * The only button in the app.
 *
 * Pages must never render a raw <button>. If a button needs an appearance this
 * component doesn't have, the variant is added here — not overridden at the
 * call site with className or inline styles.
 */
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  leadingIcon = null,
  trailingIcon = null,
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const iconBox = ICON_SIZE[size] ?? ICON_SIZE.md;

  const renderIcon = (node) =>
    node ? (
      <span
        className="shrink-0 grid place-items-center"
        style={{ width: iconBox, height: iconBox }}
        aria-hidden="true"
      >
        {node}
      </span>
    ) : null;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        BASE,
        SIZES[size] ?? SIZES.md,
        VARIANTS[variant] ?? VARIANTS.secondary,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <span
          className="shrink-0 rounded-full border-[1.5px] border-current border-r-transparent animate-spin"
          style={{ width: iconBox - 3, height: iconBox - 3 }}
          aria-hidden="true"
        />
      ) : (
        renderIcon(leadingIcon)
      )}
      {children}
      {renderIcon(trailingIcon)}
    </button>
  );
}
