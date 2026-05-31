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
  const handleRowClick = () => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange(row._id);
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`border-b border-spurly-border transition last:border-b-0 ${
        onRowClick ? 'hover:bg-spurly-surface-bg cursor-pointer' : ''
      } ${isSelected ? 'bg-spurly-purple/5' : ''}`}
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
