import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export function HeaderCell({ column = {}, sort = {}, onSort = () => {} }) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const renderSortIcon = () => {
    if (!column.sortable) return null;

    const isActive = sort.key === column.key;
    if (!isActive) {
      return <ChevronsUpDown size={14} className="text-spurly-text-secondary opacity-50" />;
    }

    return sort.direction === 'asc' ? (
      <ChevronUp size={14} className="text-spurly-purple" />
    ) : (
      <ChevronDown size={14} className="text-spurly-purple" />
    );
  };

  return (
    <th
      className={`px-4 py-3 text-label font-semibold text-spurly-navy-light align-middle bg-white border-b border-spurly-border whitespace-nowrap ${
        alignClass[column.align] || 'text-left'
      } ${column.headerClassName || ''}`}
      style={{ width: column.width, minWidth: column.minWidth }}
      data-column-id={column.key}
    >
      {column.sortable ? (
        <button
          onClick={() => onSort(column.key)}
          className="inline-flex items-center gap-1 hover:text-spurly-purple transition"
        >
          {column.label}
          {renderSortIcon()}
        </button>
      ) : (
        column.label
      )}
    </th>
  );
}
