import { Row } from './Row';
import { SkeletonRow } from './SkeletonRow';
import { EmptyState } from 'src/ui/primitives';

const SKELETON_ROWS = 10;

export function Body({
  data = [],
  columns = [],
  rowKey,
  density = 'default',
  selectable = false,
  selectedKeys = new Set(),
  onToggleSelect,
  onRowClick,
  loading = false,
  emptyMessage = 'Nothing here yet',
  emptyHint,
  emptyAction = null,
  colCount = 0,
}) {
  if (loading) {
    return (
      <tbody>
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <SkeletonRow
            key={i}
            index={i}
            columns={columns}
            selectable={selectable}
            density={density}
          />
        ))}
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={colCount}>
            <EmptyState title={emptyMessage} hint={emptyHint} action={emptyAction} />
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {data.map((row) => {
        const id = rowKey(row);
        return (
          <Row
            key={id}
            rowId={id}
            row={row}
            columns={columns}
            density={density}
            selectable={selectable}
            isSelected={selectedKeys.has(id)}
            onRowClick={onRowClick}
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </tbody>
  );
}
