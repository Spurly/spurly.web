import { useEffect, useState } from 'react';
import { SearchIcon } from 'src/core/icons';
import { Input } from 'src/core/primitives';

/**
 * The table's own toolbar band — search on the left, then any filter chips,
 * then (pushed right) the list picker / filters / actions.
 *
 * v3 (Leads v2): the band stays put while rows are selected. Selection opens
 * its OWN band underneath (BulkActionBar), so a user never loses the search
 * they typed by ticking a box.
 */
export function TableToolbar({
  searchValue,
  onSearch,
  searchPlaceholder = 'Search',
  searchDebounce = 350,
  chips = null,
  filters = null,
  actions = null,
}) {
  const [localSearch, setLocalSearch] = useState(searchValue || '');

  /**
   * Reseed the local value when the page resets the search externally (tab
   * change clears it). Adjusted during render rather than in an effect, so
   * the stale value is never committed.
   */
  const [lastExternalSearch, setLastExternalSearch] = useState(searchValue || '');
  if ((searchValue || '') !== lastExternalSearch) {
    setLastExternalSearch(searchValue || '');
    setLocalSearch(searchValue || '');
  }

  useEffect(() => {
    if (!onSearch) return undefined;
    const id = setTimeout(() => {
      if (localSearch !== (searchValue || '')) onSearch(localSearch);
    }, searchDebounce);
    return () => clearTimeout(id);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const right = filters || actions;
  if (!onSearch && !chips && !right) return null;

  return (
    <div className="flex items-center gap-2 min-h-[var(--ui-band)] px-[var(--ui-card-x)] border-b border-[var(--ui-neutral-150)] bg-[var(--ui-surface-card)]">
      {onSearch && (
        <Input
          size="sm"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          leadingIcon={<SearchIcon size={14} strokeWidth={2} />}
          aria-label={searchPlaceholder}
          className="w-[240px] min-w-[150px] shrink [&>input]:w-full"
        />
      )}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto py-[11px]">{chips}</div>
      {right && (
        <div className="flex items-center gap-1.5 shrink-0">
          {filters}
          {actions}
        </div>
      )}
    </div>
  );
}
