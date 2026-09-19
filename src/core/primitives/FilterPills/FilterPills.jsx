/**
 * The handoff's status filter pills (Campaigns "All 4 · Sending 2 · Paused 1
 * · Finished 1", Inbox "All 5 · Unread 2 · Interested 1"): rounded pills with
 * a mono count, the active one on the accent tint.
 */
export function FilterPills({ options = [], value, onChange, ariaLabel = 'Filter', size = 'md', className = '' }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={[
              'inline-flex items-center gap-1.5 rounded-[var(--ui-radius-pill)] border whitespace-nowrap',
              size === 'sm' ? 'h-7 px-2.5 text-[length:var(--ui-t-label)]' : 'h-[30px] px-3 text-[length:var(--ui-t-control)]',
              'transition-[background-color,border-color,color,box-shadow] duration-[var(--ui-dur-fast)]',
              'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
              active
                ? 'bg-[var(--ui-accent-tint)] border-[var(--ui-accent-border)] text-[var(--ui-accent-fg)]'
                : 'bg-[var(--ui-surface-card)] border-[var(--ui-border)] text-[var(--ui-text-body)] hover:border-[var(--ui-accent-border)] hover:shadow-[var(--ui-hover-ring)]',
            ].join(' ')}
          >
            {opt.label}
            {opt.count != null && (
              <span
                className={`font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] ${
                  active ? 'text-[var(--ui-accent-fg)]' : 'text-[var(--ui-neutral-400)]'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
