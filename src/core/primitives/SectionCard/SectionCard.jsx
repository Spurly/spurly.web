import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'src/core/icons';

/**
 * A titled card region — the handoff's panel: a 48px header carrying a
 * MONO MICRO-CAPS label ("CAMPAIGNS RUNNING", "INVOICES", "TOP OF THE LIST")
 * and, on the right, one quiet text action ("Manage", "All leads"), over a
 * hairline, then the body.
 *
 * `tone="accent"` is for a panel Spurly itself is speaking in ("WORTH YOUR
 * ATTENTION", "CURRENT PLAN"): the label goes accent-blue, with an optional
 * leading glyph, and `spine` adds the 2px live edge down the left side.
 */
export function SectionCard({
  title,
  onViewAll,
  viewAllLabel = 'View all',
  action = null,
  icon = null,
  tone = 'neutral',
  spine = false,
  children,
  noPadding = false,
  className = '',
  bodyClassName = '',
  collapsible = false,
  defaultCollapsed = true,
  collapsedSummary,
}) {
  const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed);
  const isCollapsed = collapsible && collapsed;
  const accent = tone === 'accent';

  return (
    <div
      className={[
        'rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)] overflow-hidden',
        spine ? 'shadow-[inset_2px_0_0_var(--ui-accent),var(--ui-shadow-sm)]' : '',
        className,
      ].join(' ')}
    >
      {title && (
        <div
          className={`flex items-center justify-between gap-3 px-4 h-12 border-b border-[var(--ui-neutral-150)] shrink-0 ${collapsible ? 'cursor-pointer select-none' : ''}`}
          onClick={collapsible ? () => setCollapsed((c) => !c) : undefined}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? !collapsed : undefined}
        >
          <div className="flex items-center gap-2 min-w-0">
            {collapsible &&
              (isCollapsed ? (
                <ChevronRightIcon size={13} strokeWidth={2} className="shrink-0 text-[var(--ui-text-quaternary)]" />
              ) : (
                <ChevronDownIcon size={13} strokeWidth={2} className="shrink-0 text-[var(--ui-text-quaternary)]" />
              ))}
            {icon && <span className={`shrink-0 ${accent ? 'text-[var(--ui-accent)]' : 'text-[var(--ui-text-quaternary)]'}`}>{icon}</span>}
            <h3
              className={`ui-micro !text-[length:var(--ui-t-micro)] shrink-0 ${
                accent ? '!text-[var(--ui-accent-fg)]' : '!text-[var(--ui-text-secondary)]'
              }`}
            >
              {title}
            </h3>
            {isCollapsed && collapsedSummary && (
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate">{collapsedSummary}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {action}
            {onViewAll && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAll();
                }}
                className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-accent-fg)] hover:underline shrink-0 focus:outline-none focus-visible:underline"
              >
                {viewAllLabel}
              </button>
            )}
          </div>
        </div>
      )}
      {!isCollapsed && <div className={`${noPadding ? '' : 'p-4'} ${bodyClassName}`}>{children}</div>}
    </div>
  );
}
