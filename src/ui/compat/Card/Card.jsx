export function Card({
  children,
  variant = 'solid',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) {
  const pads = { none: '', sm: 'p-4', md: 'p-[var(--ui-pad-lg)]', lg: 'p-8' };

  const variants = {
    solid:
      'bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)]',
    /* `glass` now resolves to `solid`. Backdrop-blur panels belong to the
       marketing surface, not to a data tool. */
    glass:
      'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]',
    sunken: 'bg-[var(--surface-sunken)] border border-transparent',
  };

  return (
    <div
      className={`rounded-[var(--ui-radius-lg)] ${pads[padding]} ${variants[variant]} ${
        interactive
          ? 'transition-colors duration-[var(--ui-dur-fast)] hover:bg-[var(--ui-surface-hover)] cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, title, subtitle, action, className = '' }) {
  if (title !== undefined) {
    return (
      <div className={`flex items-start justify-between gap-4 mb-5 ${className}`}>
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium text-[var(--text-primary)] tracking-[-0.012em] truncate">{title}</h3>
          {subtitle && <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
  return <div className={`mb-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-[17px] font-medium text-[var(--text-primary)] tracking-[-0.012em] ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
