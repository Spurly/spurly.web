export function Cell({ value, row = {}, column = {}, className = '' }) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

  return (
    <td
      className={`px-4 py-3 text-[13px] text-[var(--text-primary)] align-middle ${
        alignClass[column.align] || 'text-left'
      } ${column.cellClassName || ''} ${className}`}
      data-column-id={column.key}
      style={{ width: column.width, minWidth: column.minWidth }}
    >
      {value}
    </td>
  );
}
