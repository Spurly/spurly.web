import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export function HeaderCell({ column = {}, sort = {}, onSort = () => {} }) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

  const renderSortIcon = () => {
    if (!column.sortable) return null;
    const isActive = sort.key === column.key;
    if (!isActive) return <ChevronsUpDown size={13} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />;
    return sort.direction === 'asc'
      ? <ChevronUp size={13} style={{ color: 'var(--brand-purple)' }} />
      : <ChevronDown size={13} style={{ color: 'var(--brand-purple)' }} />;
  };

  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] align-middle whitespace-nowrap border-b border-[var(--separator)] ${
        alignClass[column.align] || 'text-left'
      } ${column.headerClassName || ''}`}
      style={{ color: 'var(--text-tertiary)', background: 'var(--surface-card)', width: column.width, minWidth: column.minWidth }}
      data-column-id={column.key}
    >
      {column.sortable ? (
        <button
          onClick={() => onSort(column.key)}
          className="inline-flex items-center gap-1 hover:text-[var(--brand-purple)] transition-colors"
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
