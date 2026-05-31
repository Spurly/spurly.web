import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useDataTable } from './useDataTable';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';

/**
 * Reusable, server-side oriented data table for spurly.web.
 *
 * Driven by a `columns` config + `data`. All heavy lifting (filtering,
 * sorting, paging) is delegated to the parent via callbacks so it stays
 * in sync with the backend.
 *
 * COLUMN SHAPE:
 *   {
 *     key:        string,                      // unique + maps to row[key]
 *     label:      string | node,               // header label
 *     render?:    (value, row) => node,        // custom cell
 *     sortable?:  boolean,                      // show sort control
 *     align?:     'left' | 'center' | 'right',
 *     width?:     string,                       // e.g. '120px'
 *     headerClassName?: string,
 *     cellClassName?: string,
 *   }
 *
 * @example
 *   <DataTable
 *     columns={columns}
 *     data={rows}
 *     rowKey={(r) => r._id}
 *     loading={loading}
 *     error={error}
 *     selectable
 *     onRowClick={openDetail}
 *     toolbar={{ onSearch, searchPlaceholder: 'Search leads...' }}
 *     sort={sort}
 *     onSortChange={setSort}
 *     pagination={{ page, pageSize, total, onPageChange, onPageSizeChange }}
 *   />
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
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

  const renderSortIcon = (col) => {
    if (!col.sortable) return null;
    const active = table.sort.key === col.key;
    if (!active) return <ChevronsUpDown size={14} className="text-spurly-text-secondary opacity-50" />;
    return table.sort.direction === 'asc' ? (
      <ChevronUp size={14} className="text-spurly-purple" />
    ) : (
      <ChevronDown size={14} className="text-spurly-purple" />
    );
  };

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {toolbar && (
        <TableToolbar
          {...toolbar}
          selectedCount={selectable ? table.selectedCount : 0}
          onClearSelection={selectable ? table.clearSelection : undefined}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 m-4 rounded-spurly">
          <p className="font-semibold">Error: {error}</p>
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-spurly-border">
              {selectable && (
                <th className="px-6 py-4 text-left w-px">
                  <input
                    type="checkbox"
                    checked={table.allSelected}
                    ref={(el) => el && (el.indeterminate = table.someSelected)}
                    onChange={table.toggleAll}
                    className="rounded cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-6 py-4 text-label font-semibold text-spurly-navy-light ${
                    alignClass[col.align] || 'text-left'
                  } ${col.headerClassName || ''}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => table.requestSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-spurly-purple transition"
                    >
                      {col.label}
                      {renderSortIcon(col)}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="px-6 py-16 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spurly-purple" />
                  <p className="mt-4 text-spurly-text-secondary">Loading...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-6 py-16 text-center">
                  <p className="text-spurly-text-secondary text-lg">{emptyMessage}</p>
                  {emptyHint && (
                    <p className="text-spurly-text-secondary text-sm mt-2">{emptyHint}</p>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = rowKey(row);
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-spurly-border transition last:border-b-0 ${
                      onRowClick ? 'hover:bg-spurly-surface-bg cursor-pointer' : ''
                    } ${table.isRowSelected(key) ? 'bg-spurly-purple/5' : ''}`}
                  >
                    {selectable && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={table.isRowSelected(key)}
                          onChange={() => table.toggleRow(key)}
                          className="rounded cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 text-label text-spurly-navy-light ${
                          alignClass[col.align] || 'text-left'
                        } ${col.cellClassName || ''}`}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && data.length > 0 && (
        <TablePagination {...pagination} />
      )}
    </div>
  );
}
