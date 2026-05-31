export function Table({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-spurly-border">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-6 py-4 text-label font-semibold text-spurly-navy-light">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-spurly-border hover:bg-spurly-surface-bg transition cursor-pointer last:border-b-0"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-body text-spurly-navy-light">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
