/**
 * Underline tabs.
 *
 * Roving tabindex: only the active tab is reachable with Tab, and arrow keys
 * move between tabs. This is the standard tablist behaviour and it means a
 * keyboard user doesn't have to step through eight tabs to reach the content.
 */
export function Tabs({ tabs = [], activeTab, onTabChange, ariaLabel = 'Views' }) {
  const handleKeyDown = (e, index) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    onTabChange(tabs[next].id);
    e.currentTarget.parentElement?.children[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className="flex items-center gap-0.5 min-w-0">
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
              'relative inline-flex items-center gap-1.5 h-9 px-2.5 text-[13px] whitespace-nowrap',
              'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none',
              'focus-visible:shadow-[var(--ui-focus-ring)] rounded-[var(--ui-radius-sm)]',
              /* The underline previews in grey on hover, then lands in accent
                 on select — so the tab bar reads as clickable before you
                 commit. `after` is the preview; the accent bar below is the
                 real state and paints over it. */
              active
                ? 'text-[var(--ui-text-primary)] font-medium'
                : 'text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)] ' +
                  'after:absolute after:left-1.5 after:right-1.5 after:-bottom-px after:h-[2px] ' +
                  'after:rounded-full after:bg-[var(--ui-border-strong)] after:opacity-0 ' +
                  'hover:after:opacity-100 after:transition-opacity after:duration-[var(--ui-dur-fast)]',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`tabular-nums text-[11.5px] ${
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
