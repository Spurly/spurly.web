export function Card({
  children,
  variant = 'solid',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) {
  const pads = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

  const variants = {
    solid:
      'bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)]',
    glass:
      'bg-[var(--glass-regular)] [backdrop-filter:blur(24px)_saturate(180%)] ' +
      'border border-[var(--border-glass)] shadow-[var(--shadow-glass)]',
    sunken: 'bg-[var(--surface-sunken)] border border-transparent',
  };

  return (
    <div
      className={`rounded-[18px] ${pads[padding]} ${variants[variant]} ${
        interactive
          ? 'transition-all duration-200 ease-out hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer'
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
          <h3 className="text-[17px] font-semibold text-[var(--text-primary)] tracking-[-0.012em] truncate">{title}</h3>
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
    <h3 className={`text-[17px] font-semibold text-[var(--text-primary)] tracking-[-0.012em] ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
