import { Cell } from './Cell';
import { Checkbox } from './Checkbox';

export function Row({
  row = {},
  columns = [],
  selectable = false,
  isSelected = false,
  onRowClick = null,
  onSelectionChange = null,
}) {
  const handleRowClick = () => onRowClick && onRowClick(row);

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onSelectionChange && onSelectionChange(row._id);
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`border-b border-[var(--separator)] transition-colors last:border-b-0 ${
        onRowClick ? 'hover:bg-[var(--surface-hover)] cursor-pointer' : ''
      } ${isSelected ? 'bg-[var(--accent-tint)]' : ''}`}
    >
      {selectable && (
        <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onChange={handleCheckboxChange} />
        </td>
      )}
      {columns.map((column) => (
        <Cell
          key={column.key}
          value={column.render ? column.render(row[column.key], row) : row[column.key]}
          row={row}
          column={column}
        />
      ))}
    </tr>
  );
}
