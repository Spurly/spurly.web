import { useDataTable } from './useDataTable';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';
import { Header, Body, Colgroup } from './components';

/**
 * Reusable, server-side oriented data table for spurly.web.
 * Uses modular components for Header, Body, Row, and Cell.
 *
 * Single-table layout with a sticky <thead>, so header and body
 * columns always stay aligned and content sizes naturally.
 *
 * COLUMN SHAPE:
 *   {
 *     key:        string,                      // unique + maps to row[key]
 *     label:      string | node,               // header label
 *     render?:    (value, row) => node,        // custom cell component
 *     sortable?:  boolean,                      // show sort control
 *     align?:     'left' | 'center' | 'right',
 *     width?:     string,                       // e.g. '120px'
 *     minWidth?:  string,                       // e.g. '120px'
 *     headerClassName?: string,
 *     cellClassName?: string,
 *   }
 */
export function DataTable({
  columns = [],
  data = [],
  rowKey = (row) => row._id ?? row.id,
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
  emptyMessage = 'No records found',
  emptyHint,
  maxHeight = '70vh',
  className = '',
}) {
  const table = useDataTable({
    data,
    rowKey,
    selectedKeys,
    onSelectionChange,
    sort,
    onSortChange,
  });

  const colCount = columns.length + (selectable ? 1 : 0);

  return (
    <div className={`flex flex-col bg-[var(--surface-card)] ${className}`}>
      {toolbar && (
        <TableToolbar
          {...toolbar}
          selectedCount={selectable ? table.selectedCount : 0}
          onClearSelection={selectable ? table.clearSelection : undefined}
        />
      )}

      {error && (
        <div className="m-4 px-4 py-3 rounded-[12px] text-[13px] font-medium"
          style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(255,69,58,0.2)' }}>
          {error}
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
          <Colgroup columns={columns} selectable={selectable} />
          <Header
            columns={columns}
            selectable={selectable}
            sort={table.sort}
            onSort={table.requestSort}
            allSelected={table.allSelected}
            onSelectAll={table.toggleAll}
          />
          <Body
            data={data}
            columns={columns}
            rowKey={rowKey}
            selectable={selectable}
            selectedKeys={table.selected}
            onSelectionChange={table.toggleRow}
            onRowClick={onRowClick}
            loading={loading}
            emptyMessage={emptyMessage}
            emptyHint={emptyHint}
            colCount={colCount}
          />
        </table>
      </div>

      {pagination && !loading && data.length > 0 && (
        <TablePagination {...pagination} />
      )}
    </div>
  );
}
