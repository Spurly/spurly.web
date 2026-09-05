/**
 * Page-level tab strip: carries its own bottom border and card background,
 * for use directly under a page header.
 *
 * `Tabs` is the other one — it sits INSIDE a toolbar and inherits its height so
 * the active underline lands on the toolbar's own border. Same props, different
 * container; sharing the name `Tabs` in two directories is what made this look
 * like a duplicate.
 */
export function PageTabs({ tabs, activeTab, onTabChange }) {
  return (
    /* Container padding is the page gutter MINUS the tab's own 10px, so the
       first tab's LABEL lands on the gutter rather than its hover box —
       the same alignment rule as ui/primitives/Tabs. */
    <div
      className="flex items-center border-b border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)]"
      style={{ paddingInline: 'calc(var(--ui-pad-lg) - 10px)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex items-center gap-1.5 h-10 px-2.5 text-[13px] font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-[var(--text-primary)] font-medium'
              : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`tabular-nums text-[11px] ${
                activeTab === tab.id
                  ? 'text-[var(--ui-text-secondary)]'
                  : 'text-[var(--ui-text-tertiary)]'
              }`}
            >
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <span className="absolute -bottom-px left-1.5 right-1.5 h-[2px] rounded-full bg-[var(--ui-accent)]" />
          )}
        </button>
      ))}
    </div>
  );
}
