import { HeaderCell } from './HeaderCell';
import { Checkbox } from './Checkbox';

export function Header({ columns = [], selectable = false, sort = {}, onSort = () => {}, onSelectAll = () => {}, allSelected = false }) {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="border-b border-[var(--separator)]" style={{ background: 'var(--surface-card)' }}>
        {selectable && (
          <th className="px-4 py-3 text-left align-middle" style={{ background: 'var(--surface-card)' }}>
            <Checkbox checked={allSelected} onChange={onSelectAll} />
          </th>
        )}
        {columns.map((column) => (
          <HeaderCell key={column.key} column={column} sort={sort} onSort={onSort} />
        ))}
      </tr>
    </thead>
  );
}
