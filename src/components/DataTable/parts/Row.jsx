import { Cell } from './Cell';
import { SelectionCheckbox } from './SelectionCheckbox';
import { resolveDensity } from 'src/ui/tokens';

export function Row({
  row = {},
  columns = [],
  density = 'default',
  selectable = false,
  isSelected = false,
  onRowClick = null,
  onToggleSelect = null,
  rowId,
}) {
  const d = resolveDensity(density);

  return (
    <tr
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      aria-selected={selectable ? isSelected : undefined}
      /* The accent edge is an INSET SHADOW, not a border or a pseudo-element:
         a border would shift every cell by 2px on hover, and a row that nudges
         sideways under the cursor feels broken. Shadows don't affect layout, so
         this is free. Requires border-collapse: separate on the table — under
         `collapse`, shadows on a <tr> don't paint reliably. */
      className={[
        'group transition-[background-color,box-shadow] duration-[var(--ui-dur-fast)]',
        onRowClick ? 'cursor-pointer' : '',
        isSelected
          ? 'bg-[var(--ui-accent-tint)] shadow-[inset_2px_0_0_var(--ui-accent)]'
          : 'hover:bg-[var(--ui-surface-hover)] hover:shadow-[inset_2px_0_0_var(--ui-accent)]',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: d.row }}
    >
      {selectable && (
        <td
          className="border-b border-[var(--ui-border-hairline)]"
          style={{ padding: `0 ${d.padX}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center h-full">
            <SelectionCheckbox
              checked={isSelected}
              onChange={() => onToggleSelect?.(rowId)}
              label={`Select row`}
            />
          </div>
        </td>
      )}

      {columns.map((column) => (
        <Cell key={column.key} row={row} column={column} density={density} />
      ))}
    </tr>
  );
}
