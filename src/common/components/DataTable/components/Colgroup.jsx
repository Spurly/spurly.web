export function Colgroup({ columns = [], selectable = false }) {
  return (
    <colgroup>
      {selectable && <col style={{ width: '48px' }} />}
      {columns.map((col) => (
        <col key={col.key} style={col.width ? { width: col.width } : undefined} />
      ))}
    </colgroup>
  );
}
