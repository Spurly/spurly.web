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
  onClick,
  title,
  className = '',
}) {
  const interactive = typeof onClick === 'function';
  const Root = interactive ? 'button' : 'span';

  return (
    <Root
      title={title}
      type={interactive ? 'button' : undefined}
      onClick={
        interactive
          ? (e) => {
              // A chip in a table row must not also open the row's drawer.
              e.stopPropagation();
              onClick(e);
            }
          : undefined
      }
      data-tone={tone === 'neutral' ? undefined : tone}
      data-interactive={interactive ? '' : undefined}
      className={['ui-chip', removable ? '!pr-1' : '', className].filter(Boolean).join(' ')}
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
    </Root>
  );
}
