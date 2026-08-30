/**
 * Underline tabs.
 *
 * Roving tabindex: only the active tab is reachable with Tab, and arrow keys
 * move between tabs. This is the standard tablist behaviour and it means a
 * keyboard user doesn't have to step through eight tabs to reach the content.
 *
 * TWO ALIGNMENT RULES, both of which were wrong before.
 *
 * 1. The strip is pulled left by its own horizontal padding, so the first
 *    tab's LABEL — not its hover box — lands on the container's left edge.
 *    Previously the label sat 10px right of everything else in the page's left
 *    rail, which is a third of the way to the next column and reads as a
 *    misalignment even though every box involved was correctly positioned.
 *
 * A tab may set `muted: true` to render dim — the caller's way of saying "this
 * tab exists but has nothing in it for this row" (see the person drawer).
 *
 * 2. Tabs are full height and the underline sits at -1px, so it paints exactly
 *    over the parent toolbar's bottom border. A fixed-height tab inside a
 *    taller bar leaves the underline floating a few pixels above the border,
 *    which is the detail that makes a tab strip look bolted on rather than
 *    part of the bar.
 */
export function Tabs({
  tabs = [],
  activeTab,
  onTabChange,
  ariaLabel = 'Views',
  /** Set false when the strip is not the first thing in its container. */
  flush = true,
}) {
  const handleKeyDown = (e, index) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    onTabChange(tabs[next].id);
    e.currentTarget.parentElement?.children[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-stretch h-full min-w-0 ${flush ? '-ml-2.5' : ''}`}
    >
      {tabs.map((tab, i) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={[
              'relative inline-flex items-center gap-1.5 h-full px-2.5 text-[13px] whitespace-nowrap',
              'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none',
              'focus-visible:shadow-[var(--ui-focus-ring)] rounded-[var(--ui-radius-sm)]',
              /* The underline previews in grey on hover, then lands in accent
                 on select — so the tab bar reads as clickable before you
                 commit. `after` is the preview; the accent bar below is the
                 real state and paints over it. */
              active
                ? 'text-[var(--ui-text-primary)] font-medium'
                : /* `muted` marks a tab with nothing behind it. Dimmed rather
                     than hidden or disabled: it is still worth opening to see
                     WHY it is empty, and a strip whose items appear and
                     disappear between rows is harder to use than one with a
                     few dim entries. */
                  (tab.muted
                    ? 'text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-secondary)] '
                    : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] ') +
                  'after:absolute after:left-1.5 after:right-1.5 after:-bottom-px after:h-[2px] ' +
                  'after:rounded-full after:bg-[var(--ui-border-strong)] after:opacity-0 ' +
                  'hover:after:opacity-100 after:transition-opacity after:duration-[var(--ui-dur-fast)]',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`tabular-nums text-[11px] ${
                  active ? 'text-[var(--ui-text-secondary)]' : 'text-[var(--ui-text-tertiary)]'
                }`}
              >
                {tab.count?.toLocaleString?.() ?? tab.count}
              </span>
            )}
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-1.5 right-1.5 -bottom-px h-[2px] rounded-full bg-[var(--ui-accent)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
