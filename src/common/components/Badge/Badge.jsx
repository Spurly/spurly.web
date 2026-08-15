export function Badge({ children, variant = 'default', tone, dot = false }) {
  const key = tone || variant;

  const styles = {
    default:  'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
    neutral:  'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
    success:  'bg-[var(--ui-success-tint)] text-[var(--ui-success-fg)]',
    warning:  'bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]',
    error:    'bg-[var(--red-tint)] text-[var(--red)]',
    danger:   'bg-[var(--red-tint)] text-[var(--red)]',
    primary:  'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]',
    accent:   'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]',
    info:     'bg-[var(--ui-info-tint)] text-[var(--ui-info-fg)]',
  };

  const dotColors = {
    success: 'bg-[var(--green)]',
    warning: 'bg-[var(--amber)]',
    error:   'bg-[var(--red)]',
    danger:  'bg-[var(--red)]',
    primary: 'bg-[var(--brand-purple)]',
    accent:  'bg-[var(--brand-purple)]',
    info:    'bg-[var(--sky)]',
    default: 'bg-[var(--text-tertiary)]',
    neutral: 'bg-[var(--text-tertiary)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[20px] px-2 rounded-full text-[11px] font-medium ${styles[key] || styles.default}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[key] || dotColors.default}`} />
      )}
      {children}
    </span>
  );
}
