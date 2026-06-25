import { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export function TableToolbar({
  searchValue,
  onSearch,
  searchPlaceholder = 'Search...',
  searchDebounce = 350,
  selectedCount = 0,
  bulkActions,
  onClearSelection,
  filters,
  actions,
}) {
  const [localSearch, setLocalSearch] = useState(searchValue || '');

  useEffect(() => { setLocalSearch(searchValue || ''); }, [searchValue]);

  useEffect(() => {
    if (!onSearch) return;
    const id = setTimeout(() => {
      if (localSearch !== (searchValue || '')) onSearch(localSearch);
    }, searchDebounce);
    return () => clearTimeout(id);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[var(--separator)] glass-chrome">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {hasSelection ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">
              {selectedCount} selected
            </span>
            {bulkActions}
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="inline-flex items-center gap-1 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>
        ) : (
          onSearch && (
            <div className="relative max-w-xs flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-9 pr-3 rounded-[10px] text-[13px] bg-[var(--surface-sunken)] border border-[var(--border-hairline)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)] transition-all"
              />
            </div>
          )
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {filters}
        {actions}
      </div>
    </div>
  );
}

export function FilterButton({ onClick, label = 'Filters', active = false }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium transition-colors ${
        active
          ? 'bg-[var(--accent-tint)] text-[var(--brand-purple)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      <Filter size={14} />
      {label}
    </button>
  );
}
