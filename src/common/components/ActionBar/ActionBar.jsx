import { ChevronDown, Filter } from 'lucide-react';

export function ActionBar({ selectedCount, onEnrich, onAddToList, onExport, onFilter }) {
  const actionBtn =
    'inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium ' +
    'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors';

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--separator)] gap-4 glass-chrome">
      <div className="flex items-center gap-1">
        {selectedCount > 0 && (
          <span className="text-[13px] font-semibold text-[var(--text-primary)] mr-2">
            {selectedCount} selected
          </span>
        )}
        <button onClick={onEnrich} className={actionBtn}>Enrich</button>
        <button onClick={onAddToList} className={actionBtn}>
          Add to list <ChevronDown size={14} />
        </button>
        <button onClick={onExport} className={actionBtn}>
          Export <ChevronDown size={14} />
        </button>
        <button className={actionBtn}>
          More <ChevronDown size={14} />
        </button>
      </div>

      <button
        onClick={onFilter}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <Filter size={14} />
        Filters
      </button>
    </div>
  );
}
