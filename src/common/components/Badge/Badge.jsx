export function Badge({ children, variant = 'default', tone, dot = false }) {
  const key = tone || variant;

  const styles = {
    default:  'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
    neutral:  'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
    success:  'bg-[var(--green-tint)] text-[var(--green)]',
    warning:  'bg-[var(--amber-tint)] text-[var(--amber)]',
    error:    'bg-[var(--red-tint)] text-[var(--red)]',
    danger:   'bg-[var(--red-tint)] text-[var(--red)]',
    primary:  'bg-[var(--accent-tint)] text-[var(--brand-purple)]',
    accent:   'bg-[var(--accent-tint)] text-[var(--brand-purple)]',
    info:     'bg-[var(--sky-tint)] text-[var(--sky)]',
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[999px] text-[12px] font-semibold tracking-[0.01em] ${styles[key] || styles.default}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[key] || dotColors.default}`} />
      )}
      {children}
    </span>
  );
}
