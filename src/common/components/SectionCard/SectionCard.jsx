import { ArrowRight } from 'lucide-react';

export function SectionCard({ title, onViewAll, children, noPadding = false }) {
  return (
    <div className="rounded-[18px] bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--separator)]">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-purple-700)] transition-colors cursor-pointer"
          >
            View all
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div className={noPadding ? '' : 'px-5 py-4'}>
        {children}
      </div>
    </div>
  );
}
