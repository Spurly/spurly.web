import { ArrowRight } from 'lucide-react';

export function SectionCard({ title, onViewAll, children, noPadding = false, className = '', bodyClassName = '' }) {
  return (
    <div className={`rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)] overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-[var(--ui-pad-lg)] h-[var(--ui-band)] border-b border-[var(--ui-border-hairline)] shrink-0">
        <h3 className="text-[var(--ui-t-section)] font-semibold tracking-[var(--ui-track-base)] text-[var(--ui-text-primary)]">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-[var(--ui-t-label)] font-semibold text-[var(--ui-accent-fg)] hover:underline transition-colors"
          >
            View all
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div className={`${noPadding ? '' : 'p-[var(--ui-pad-lg)]'} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
