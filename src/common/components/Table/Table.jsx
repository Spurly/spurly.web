export function Table({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--separator)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)] whitespace-nowrap"
              >
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
              className={`border-b border-[var(--separator)] transition-colors last:border-b-0 ${
                onRowClick ? 'hover:bg-[var(--surface-hover)] cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3.5 text-[13.5px] text-[var(--text-primary)]">
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
