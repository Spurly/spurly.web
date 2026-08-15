import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from 'src/ui/primitives';
import { Toolbar as ToolbarShell } from 'src/ui/layout';
import { BulkActionBar } from './BulkActionBar';

export function TableToolbar({
  searchValue,
  onSearch,
  searchPlaceholder = 'Search',
  searchDebounce = 350,
  selectedCount = 0,
  bulkActions = null,
  onClearSelection,
  filters = null,
  actions = null,
}) {
  const [localSearch, setLocalSearch] = useState(searchValue || '');

  /**
   * Reseed the local value when the page resets the search externally (tab
   * change clears it).
   *
   * Adjusted during render rather than in an effect: syncing a prop into state
   * from `useEffect` renders once with the stale value, then again with the
   * fresh one. React re-runs this component immediately without committing the
   * first pass, so the user never sees the intermediate state.
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

  const hasSelection = selectedCount > 0;

  return (
    <ToolbarShell
      left={
        hasSelection ? (
          <BulkActionBar count={selectedCount} onClear={onClearSelection}>
            {bulkActions}
          </BulkActionBar>
        ) : (
          onSearch && (
            /* size="sm" (28px), matching every other control in this bar. It
               was "md" (32px), so the search field stood 4px taller than the
               buttons and the status filter beside it. */
            <Input
              size="sm"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              leadingIcon={<Search size={14} />}
              aria-label={searchPlaceholder}
              className="w-full max-w-[260px]"
              fullWidth
            />
          )
        )
      }
      right={
        <>
          {filters}
          {actions}
        </>
      }
    />
  );
}
