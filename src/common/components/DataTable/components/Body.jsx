import { Row } from './Row';
import { SkeletonRow } from './SkeletonRow';

const SKELETON_COUNT = 8;

export function Body({
  data = [],
  columns = [],
  rowKey = (row) => row._id ?? row.id,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange = null,
  onRowClick = null,
  loading = false,
  emptyMessage = 'No records found',
  emptyHint = '',
  colCount = 0,
}) {
  return (
    <tbody>
      {loading ? (
        Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonRow key={i} index={i} columns={columns} selectable={selectable} />
        ))
      ) : data.length === 0 ? (
        <tr>
          <td colSpan={colCount} className="px-6 py-16 text-center">
            <p className="text-[15px] font-medium text-[var(--text-secondary)]">{emptyMessage}</p>
            {emptyHint && (
              <p className="text-[13px] text-[var(--text-tertiary)] mt-1.5">{emptyHint}</p>
            )}
          </td>
        </tr>
      ) : (
        data.map((row) => {
          const key = rowKey(row);
          return (
            <Row
              key={key}
              row={row}
              columns={columns}
              selectable={selectable}
              isSelected={selectedKeys.has(key)}
              onRowClick={onRowClick}
              onSelectionChange={onSelectionChange}
            />
          );
        })
      )}
    </tbody>
  );
}
