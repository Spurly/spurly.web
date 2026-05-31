import { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

/**
 * Toolbar above the table: optional title, debounced search, filter chips,
 * bulk actions (shown when rows are selected), and a custom right-side slot.
 */
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

  // Keep local state in sync if parent resets it.
  useEffect(() => {
    setLocalSearch(searchValue || '');
  }, [searchValue]);

  // Debounce search emit.
  useEffect(() => {
    if (!onSearch) return;
    const id = setTimeout(() => {
      if (localSearch !== (searchValue || '')) onSearch(localSearch);
    }, searchDebounce);
    return () => clearTimeout(id);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-spurly-border">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {hasSelection ? (
          <div className="flex items-center gap-3">
            <span className="text-label font-medium text-spurly-navy-light">
              {selectedCount} selected
            </span>
            {bulkActions}
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="flex items-center gap-1 text-label text-spurly-text-secondary hover:text-spurly-navy-light transition"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        ) : (
          onSearch && (
            <div className="relative max-w-sm flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-spurly-text-secondary"
              />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-spurly-surface-bg border border-spurly-border rounded-spurly text-label text-spurly-navy-light placeholder-spurly-text-secondary focus:outline-none focus:border-spurly-purple focus:ring-2 focus:ring-spurly-purple/20 transition"
              />
            </div>
          )
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {filters}
        {actions}
      </div>
    </div>
  );
}

/** Small reusable filter-trigger button to keep page code tidy. */
export function FilterButton({ onClick, label = 'Filters', active = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-spurly font-medium text-label transition ${
        active
          ? 'bg-spurly-purple/10 text-spurly-purple'
          : 'hover:bg-spurly-surface-bg text-spurly-navy-light'
      }`}
    >
      <Filter size={16} />
      {label}
    </button>
  );
}
