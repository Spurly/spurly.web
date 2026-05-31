import { Row } from './Row';

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
          <tr>
            <td colSpan={colCount} className="px-6 py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spurly-purple" />
              <p className="mt-4 text-spurly-text-secondary">Loading...</p>
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="px-6 py-16 text-center">
              <p className="text-spurly-text-secondary text-lg">{emptyMessage}</p>
              {emptyHint && (
                <p className="text-spurly-text-secondary text-sm mt-2">{emptyHint}</p>
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
