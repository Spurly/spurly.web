/**
 * User content, wearing a chip.
 *
 * The counterpart to Badge, and the distinction is the point: Badge reports
 * a MACHINE state (queued, importing, failed, active) and is set in mono
 * micro-caps; Tag carries something a PERSON typed or chose — an industry,
 * a list name, a saved filter, a note label — and stays in the sans, in the
 * case it was written in.
 *
 * Without the split, "Imported" and "Engineering" render identically and the
 * reader has to know the product to tell which one the system decided. With
 * it, you can tell at a glance and without reading the word.
 *
 * `removable` turns it into the filter-chip form used in the dock and the
 * tag pickers.
 */
export function Tag({
  children,
  tone = 'neutral',
  removable = false,
  onRemove,
  title,
  className = '',
}) {
  const palette =
    tone === 'accent'
      ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
      : 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)]';

  return (
    <span
      title={title}
      className={[
        'inline-flex items-center gap-1.5 h-6 max-w-full rounded-[var(--ui-radius-xs)]',
        'text-[length:var(--ui-t-label)] font-medium whitespace-nowrap',
        removable ? 'pl-2.5 pr-1' : 'px-2.5',
        palette,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="truncate">{children}</span>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === 'string' ? children : 'tag'}`}
          className={[
            'shrink-0 grid place-items-center w-4 h-4 rounded-[4px] leading-none',
            'text-current opacity-60 hover:opacity-100',
            'hover:bg-[var(--ui-accent-tint-strong)]',
            'transition-opacity duration-[var(--ui-dur-fast)]',
            'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
          ].join(' ')}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
