import { OUTREACH_FILTERS } from 'src/common/utils/outreach';

/**
 * Outreach status filter — a segmented control in the table toolbar.
 *
 * SELECTED-STATE RULE. The app had five different ways of saying "this one is
 * selected": accent tint plus a left bar (sidebar), an accent underline
 * (tabs), a white surface with an inset ring (here), an accent tint fill
 * (pagination) and a danger tint (the attention toggle). Five encodings of one
 * concept means the rule can't be learned, so every screen has to be re-read.
 *
 * There are two now, split by what kind of control it is:
 *
 *   navigational (tabs)  -> accent underline, primary text. No fill.
 *   stateful (this, the sidebar, pagination) -> accent tint fill, accent text.
 *
 * This control was the odd one out: its selected segment carried no accent at
 * all, so accent didn't reliably mean "selected" anywhere in the product. The
 * inset ring is gone with it — a ring plus a fill is two ways of drawing the
 * same edge.
 *
 * Height is 28px including the 2px track padding, matching the search field
 * and the buttons either side of it.
 */
export function StatusFilter({ value = 'all', onChange, counts = {}, total }) {
  return (
    <div
      role="group"
      aria-label="Filter by outreach status"
      className="flex items-center gap-0.5 p-0.5 h-7 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)]"
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
                ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] font-medium'
                : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]',
            ].join(' ')}
          >
            {filter.label}
            {typeof count === 'number' && (
              <span
                className={`tabular-nums ${
                  active ? 'text-[var(--ui-accent-fg)] opacity-70' : 'text-[var(--ui-text-tertiary)]'
                }`}
              >
                {count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
