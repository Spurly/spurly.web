import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * `collapsible` sections start collapsed (`defaultCollapsed`, default true
 * once collapsible) and show `collapsedSummary` inline next to the title
 * instead of the body — for content that matters most while it's being set
 * up (a campaign's message, a sequence's steps) but turns into visual
 * weight sitting on top of the real point of the page (the members/
 * enrollments table) once it's just sitting there unchanged.
 */
export function SectionCard({
  title,
  onViewAll,
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

  return (
    <div className={`rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)] overflow-hidden ${className}`}>
      <div
        className={`flex items-center justify-between gap-3 px-[var(--ui-pad-lg)] h-[var(--ui-band)] border-b border-[var(--ui-border-hairline)] shrink-0 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setCollapsed((c) => !c) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !collapsed : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsible && (
            isCollapsed
              ? <ChevronRight size={14} className="shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
              : <ChevronDown size={14} className="shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
          )}
          <h3 className="text-[var(--ui-t-section)] font-semibold tracking-[var(--ui-track-base)] text-[var(--ui-text-primary)] shrink-0">{title}</h3>
          {isCollapsed && collapsedSummary && (
            <span className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate">{collapsedSummary}</span>
          )}
        </div>
        {onViewAll && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewAll(); }}
            className="inline-flex items-center gap-1 text-[var(--ui-t-label)] font-semibold text-[var(--ui-accent-fg)] hover:underline transition-colors shrink-0"
          >
            View all
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className={`${noPadding ? '' : 'p-[var(--ui-pad-lg)]'} ${bodyClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}
