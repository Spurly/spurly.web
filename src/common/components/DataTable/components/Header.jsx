import { HeaderCell } from './HeaderCell';
import { Checkbox } from './Checkbox';

export function Header({ columns = [], selectable = false, sort = {}, onSort = () => {}, onSelectAll = () => {}, allSelected = false }) {
  return (
    <thead className="sticky top-0 z-10 bg-white">
      <tr className="border-b border-spurly-border">
        {selectable && (
          <th className="px-4 py-3 text-left align-middle bg-white border-b border-spurly-border">
            <Checkbox checked={allSelected} onChange={onSelectAll} />
          </th>
        )}
        {columns.map((column) => (
          <HeaderCell
            key={column.key}
            column={column}
            sort={sort}
            onSort={onSort}
          />
        ))}
      </tr>
    </thead>
  );
}
