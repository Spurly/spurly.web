export function Button({
  children,
  variant = 'primary',
  size = 'md',
  leadingIcon = null,
  trailingIcon = null,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[11px]',
    md: 'h-10 px-4 text-[14px] gap-2 rounded-[14px]',
    lg: 'h-12 px-5 text-[15px] gap-2 rounded-[16px]',
  };

  const base =
    'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none ' +
    'transition-all duration-200 ease-out active:scale-[0.97] focus:outline-none ' +
    'focus-visible:shadow-[0_0_0_3px_var(--focus-ring)] disabled:opacity-50 disabled:pointer-events-none ' +
    'tracking-[-0.006em]';

  const variants = {
    primary:
      'bg-[var(--accent)] text-white shadow-[var(--shadow-accent)] hover:bg-[var(--accent-hover)] hover:-translate-y-px',
    gradient:
      'text-white shadow-[var(--shadow-accent)] hover:-translate-y-px [background:var(--brand-gradient-vivid)]',
    secondary:
      'text-[var(--text-primary)] bg-[var(--glass-thin)] [backdrop-filter:blur(12px)_saturate(180%)] ' +
      'border border-[var(--border-glass)] shadow-[var(--glass-inner-glow)] hover:bg-[var(--glass-regular)]',
    ghost:
      'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
    danger:
      'bg-[var(--red)] text-white hover:brightness-95 shadow-[0_6px_18px_rgba(255,69,58,0.28)]',
  };

  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 19 : 17;
  const renderIcon = (node) =>
    node ? (
      <span className="shrink-0 grid place-items-center" style={{ width: iconSize, height: iconSize }}>
        {node}
      </span>
    ) : null;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {renderIcon(leadingIcon)}
      {children}
      {renderIcon(trailingIcon)}
    </button>
  );
}
