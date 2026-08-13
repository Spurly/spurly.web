import { OUTREACH_FILTERS } from 'src/common/utils/outreach';

/**
 * Outreach status filter — a segmented control in the table toolbar.
 *
 * The active segment is a plain white surface with a hairline ring. It used to
 * carry a drop shadow, which is the iOS-2015 segmented-control tell; a ring
 * reads flatter and matches everything else in the app.
 */
export function StatusFilter({ value = 'all', onChange, counts = {}, total }) {
  return (
    <div
      role="group"
      aria-label="Filter by outreach status"
      className="flex items-center gap-0.5 p-0.5 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)]"
    >
      {OUTREACH_FILTERS.map((filter) => {
        const active = value === filter.id;
        const count = filter.id === 'all' ? total : counts[filter.id];
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            aria-pressed={active}
            className={[
              'inline-flex items-center gap-1 h-6 px-2 rounded-[var(--ui-radius-xs)] text-[12px]',
              'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none',
              'focus-visible:shadow-[var(--ui-focus-ring)] whitespace-nowrap',
              active
                ? 'bg-[var(--ui-surface-card)] text-[var(--ui-text-primary)] font-medium shadow-[inset_0_0_0_1px_var(--ui-border)]'
                : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]',
            ].join(' ')}
          >
            {filter.label}
            {typeof count === 'number' && (
              <span className="tabular-nums text-[var(--ui-text-tertiary)]">
                {count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
