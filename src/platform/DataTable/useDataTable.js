import { useState, useCallback, useMemo } from 'react';

/**
 * Headless state helper for DataTable (server-side oriented).
 *
 * Selection can be controlled (pass selectedKeys + onSelectionChange) or
 * left internal. Sorting state is tracked here but actual data ordering is
 * expected to be done server-side via the onSortChange callback.
 *
 * @param {Object}   opts
 * @param {Array}    opts.data            current page of rows
 * @param {Function} opts.rowKey          (row) => unique key
 * @param {Set}      [opts.selectedKeys]  controlled selection
 * @param {Function} [opts.onSelectionChange]
 * @param {Object}   [opts.sort]          controlled sort { key, direction }
 * @param {Function} [opts.onSortChange]
 */
export function useDataTable({
  data = [],
  rowKey,
  selectedKeys,
  onSelectionChange,
  sort,
  onSortChange,
}) {
  // ----- Selection (controlled or internal) -----
  const [internalSelected, setInternalSelected] = useState(() => new Set());
  const isControlledSelection = selectedKeys instanceof Set;
  const selected = isControlledSelection ? selectedKeys : internalSelected;

  const commitSelection = useCallback(
    (next) => {
      if (!isControlledSelection) setInternalSelected(next);
      onSelectionChange?.(next);
    },
    [isControlledSelection, onSelectionChange]
  );

  const toggleRow = useCallback(
    (key) => {
      const next = new Set(selected);
      next.has(key) ? next.delete(key) : next.add(key);
      commitSelection(next);
    },
    [selected, commitSelection]
  );

  const pageKeys = useMemo(
    () => data.map((row) => rowKey(row)),
    [data, rowKey]
  );

  const allSelected =
    pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const someSelected =
    pageKeys.some((k) => selected.has(k)) && !allSelected;

  const toggleAll = useCallback(() => {
    const next = new Set(selected);
    if (allSelected) {
      pageKeys.forEach((k) => next.delete(k));
    } else {
      pageKeys.forEach((k) => next.add(k));
    }
    commitSelection(next);
  }, [selected, allSelected, pageKeys, commitSelection]);

  const clearSelection = useCallback(
    () => commitSelection(new Set()),
    [commitSelection]
  );

  // ----- Sorting -----
  const [internalSort, setInternalSort] = useState({ key: null, direction: null });
  const isControlledSort = sort != null;
  const activeSort = isControlledSort ? sort : internalSort;

  const requestSort = useCallback(
    (key) => {
      let direction = 'asc';
      if (activeSort.key === key && activeSort.direction === 'asc') {
        direction = 'desc';
      } else if (activeSort.key === key && activeSort.direction === 'desc') {
        direction = null; // third click clears
      }
      const next = { key: direction ? key : null, direction };
      if (!isControlledSort) setInternalSort(next);
      onSortChange?.(next);
    },
    [activeSort, isControlledSort, onSortChange]
  );

  return {
    selected,
    isRowSelected: (key) => selected.has(key),
    toggleRow,
    toggleAll,
    clearSelection,
    allSelected,
    someSelected,
    selectedCount: selected.size,
    sort: activeSort,
    requestSort,
  };
}
