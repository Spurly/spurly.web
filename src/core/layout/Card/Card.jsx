/**
 * Flat surface with a hairline border. Direction A has no elevated cards in the
 * app body — depth is reserved for things that genuinely float (popovers,
 * dialogs), so a card never competes with them.
 */
export function Card({ children, padded = false, flush = false, className = '' }) {
  return (
    <div
      className={[
        'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)]',
        flush ? 'overflow-hidden' : '',
        padded ? 'p-4' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
