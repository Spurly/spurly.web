import { HeaderCell } from './HeaderCell';
import { SelectionCheckbox } from './SelectionCheckbox';
import { resolveDensity } from 'src/ui/tokens';

export function Header({
  columns = [],
  selectable = false,
  sort = {},
  onSort,
  allSelected = false,
  someSelected = false,
  onToggleAll,
  density = 'default',
  sticky = true,
}) {
  const d = resolveDensity(density);

  return (
    <thead className={sticky ? 'sticky top-0 z-[2]' : undefined}>
      <tr>
        {selectable && (
          <th
            scope="col"
            className="bg-[var(--ui-surface-card)] border-b border-[var(--ui-border)]"
            style={{ height: d.header, padding: `0 ${d.padX}px` }}
          >
            <div className="flex items-center h-full">
              <SelectionCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleAll}
                label="Select all rows on this page"
              />
            </div>
          </th>
        )}
        {columns.map((column) => (
          <HeaderCell
            key={column.key}
            column={column}
            sort={sort}
            onSort={onSort}
            density={density}
          />
        ))}
      </tr>
    </thead>
  );
}
