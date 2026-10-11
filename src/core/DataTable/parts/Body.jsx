import { Row } from './Row';
import { SkeletonRow } from './SkeletonRow';
import { EmptyState } from 'src/core/primitives';

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
  rowTone = null,
  rowActions = null,
  loading = false,
  emptyMessage = 'Nothing here yet',
  emptyHint,
  emptyAction = null,
  emptyIcon = null,
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
            <EmptyState icon={emptyIcon} title={emptyMessage} hint={emptyHint} action={emptyAction} />
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {data.map((row, rowIndex) => {
        const id = rowKey(row);
        return (
          <Row
            key={id}
            rowId={id}
            index={rowIndex}
            row={row}
            columns={columns}
            density={density}
            selectable={selectable}
            isSelected={selectedKeys.has(id)}
            onRowClick={onRowClick}
            tone={rowTone ? rowTone(row) : null}
            actions={rowActions ? rowActions(row) : null}
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </tbody>
  );
}
