import { useCallback, useMemo, useState } from 'react';
import { useDataTable } from './useDataTable';
import { applyColumnOrder } from './columnOrder';
import { Colgroup, Header, Body, TableToolbar, Pagination } from './parts';
import { DEFAULT_DENSITY } from 'src/ui/tokens';

const SELECTION_WIDTH = 40;

/**
 * Server-side oriented data table.
 *
 * The contract that makes it look right, enforced here rather than trusted to
 * call sites:
 *
 *   - `table-layout: fixed`, so the widths declared in a column definition are
 *     binding. Under `auto` (what the old table used) the browser treats them
 *     as hints and lets a long cell blow the column out, which is what produced
 *     240px rows next to 40px ones.
 *   - Row height comes from the density token. Cells cannot change it.
 *   - When declared widths exceed the container the table scrolls horizontally
 *     instead of squashing columns.
 *
 * COLUMN SHAPE
 *   key        string                     unique, maps to row[key]
 *   label      string | node
 *   width      number                     px. REQUIRED — fixed layout needs it.
 *   render?    (value, row) => node
 *   sortable?  boolean
 *   align?     'left' | 'center' | 'right'
 *   wrap?      boolean                    two lines instead of one, still clamped
 *   title?     (row) => string            hover text; defaults to the raw value
 *   headerClassName? / cellClassName?
 *   locked?    boolean                    excluded from drag-to-reorder; keeps
 *                                         its position in the definition array
 *
 * COLUMN REORDERING
 *   Pass `reorderable` to let the user drag a header into a new position. The
 *   resulting key order is handed to `onColumnOrderChange` - the caller owns
 *   persistence (see useTableColumnOrder for the server-backed version). With
 *   `reorderable` but no handler the table keeps the order in local state,
 *   which is enough for a preview or a throwaway table.
 */
export function DataTable({
  columns = [],
  data = [],
  rowKey = (row) => row._id ?? row.id,
  reorderable = false,
  columnOrder,
  onColumnOrderChange,
  density = DEFAULT_DENSITY,
  loading = false,
  error = null,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  onRowClick,
  sort,
  onSortChange,
  pagination,
  toolbar,
  stickyHeader = true,
  emptyMessage = 'Nothing here yet',
  emptyHint,
  emptyAction = null,
  className = '',
}) {
  const table = useDataTable({ data, rowKey, selectedKeys, onSelectionChange, sort, onSortChange });

  /* Order is controlled when the caller passes `columnOrder`; otherwise the
     table remembers it for the life of the mount. */
  const [internalOrder, setInternalOrder] = useState(null);
  const activeOrder = columnOrder ?? internalOrder;

  const orderedColumns = useMemo(
    () => (reorderable ? applyColumnOrder(columns, activeOrder) : columns),
    [reorderable, columns, activeOrder],
  );

  const handleReorder = useCallback(
    (nextKeys) => {
      if (columnOrder == null) setInternalOrder(nextKeys);
      onColumnOrderChange?.(nextKeys);
    },
    [columnOrder, onColumnOrderChange],
  );

  const totalWidth = useMemo(
    () =>
      orderedColumns.reduce((sum, col) => sum + (Number(col.width) || 160), 0) +
      (selectable ? SELECTION_WIDTH : 0),
    [orderedColumns, selectable],
  );

  if (import.meta.env?.DEV) {
    const missing = orderedColumns.filter((c) => !c.width).map((c) => c.key);
    if (missing.length) {
      console.warn(
        `[DataTable] Columns without an explicit width fall back to 160px under ` +
          `table-layout: fixed. Set one for: ${missing.join(', ')}`,
      );
    }
  }

  const colCount = orderedColumns.length + (selectable ? 1 : 0);

  /**
   * Lift the toolbar once rows pass under it.
   *
   * Only sets state when the boolean actually flips, so a scroll gesture
   * triggers at most two renders rather than one per frame.
   */
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = useCallback((e) => {
    const past = e.currentTarget.scrollTop > 0;
    setScrolled((prev) => (prev === past ? prev : past));
  }, []);

  return (
    <div className={`flex flex-col min-h-0 h-full bg-[var(--ui-surface-card)] ${className}`}>
      {toolbar && (
        <div
          className={`shrink-0 relative z-[3] transition-shadow duration-[var(--ui-dur-base)] ${
            scrolled ? 'shadow-[0_1px_3px_rgba(24,24,27,0.07)]' : ''
          }`}
        >
          <TableToolbar
            {...toolbar}
            selectedCount={selectable ? table.selectedCount : 0}
            onClearSelection={selectable ? table.clearSelection : undefined}
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mx-3 my-2 px-3 py-2 rounded-[var(--ui-radius-sm)] text-[12px] bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)]"
        >
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto" onScroll={handleScroll}>
        <table
          className="w-full"
          style={{
            tableLayout: 'fixed',
            minWidth: totalWidth,
            /* `separate` with zero spacing looks identical to `collapse` here —
               cell borders do the drawing — but lets a <tr> paint the inset
               shadow used for the hover and selection edge. */
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <Colgroup
            columns={orderedColumns}
            selectable={selectable}
            selectionWidth={SELECTION_WIDTH}
          />
          <Header
            columns={orderedColumns}
            selectable={selectable}
            sort={table.sort}
            onSort={table.requestSort}
            allSelected={table.allSelected}
            someSelected={table.someSelected}
            onToggleAll={table.toggleAll}
            density={density}
            sticky={stickyHeader}
            reorderable={reorderable}
            onReorder={handleReorder}
          />
          <Body
            data={data}
            columns={orderedColumns}
            rowKey={rowKey}
            density={density}
            selectable={selectable}
            selectedKeys={table.selected}
            onToggleSelect={table.toggleRow}
            onRowClick={onRowClick}
            loading={loading}
            emptyMessage={emptyMessage}
            emptyHint={emptyHint}
            emptyAction={emptyAction}
            colCount={colCount}
          />
        </table>
      </div>

      {pagination && !loading && data.length > 0 && <Pagination {...pagination} />}
    </div>
  );
}
