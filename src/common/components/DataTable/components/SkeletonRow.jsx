const widths = ['60%', '80%', '55%', '70%', '65%', '75%', '50%', '60%', '70%', '55%'];

export function SkeletonRow({ columns = [], selectable = false, index = 0 }) {
  return (
    <tr className="border-b border-[var(--separator)] last:border-b-0">
      {selectable && (
        <td className="px-4 py-3 align-middle">
          <div className="w-4 h-4 rounded-[4px] animate-pulse" style={{ background: 'var(--surface-sunken)' }} />
        </td>
      )}
      {columns.map((col, i) => (
        <td key={col.key} className="px-4 py-3 align-middle">
          {i === (selectable ? 1 : 0) && col.key === 'name' ? (
            /* Name cell — avatar + bar */
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-[9px] shrink-0 animate-pulse"
                style={{ background: 'var(--surface-sunken)' }}
              />
              <div className="flex flex-col gap-1.5 flex-1">
                <div
                  className="h-3 rounded-[6px] animate-pulse"
                  style={{ background: 'var(--surface-sunken)', width: widths[(index + i) % widths.length] }}
                />
                <div
                  className="h-2 rounded-[6px] animate-pulse"
                  style={{ background: 'var(--border-hairline)', width: '30%' }}
                />
              </div>
            </div>
          ) : (
            <div
              className="h-3 rounded-[6px] animate-pulse"
              style={{
                background: 'var(--surface-sunken)',
                width: widths[(index + i + 3) % widths.length],
              }}
            />
          )}
        </td>
      ))}
    </tr>
  );
}
