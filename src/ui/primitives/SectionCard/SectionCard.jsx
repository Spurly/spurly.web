import { ArrowRight } from 'lucide-react';

export function SectionCard({ title, onViewAll, children, noPadding = false }) {
  return (
    <div className="rounded-[var(--ui-radius-lg)] bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-center justify-between px-[var(--ui-pad-lg)] py-4 border-b border-[var(--separator)]">
        <h3 className="text-[14px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--brand-purple)] hover:text-[var(--brand-purple-700)] transition-colors cursor-pointer"
          >
            View all
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div className={noPadding ? '' : 'px-[var(--ui-pad-lg)] py-4'}>
        {children}
      </div>
    </div>
  );
}
