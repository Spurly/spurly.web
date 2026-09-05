/**
 * Column widths.
 *
 * With `table-layout: fixed` on the table these are binding, not suggestions.
 * That is the difference from the old table, which declared the same widths and
 * then discarded them under `table-layout: auto`.
 */
export function Colgroup({ columns = [], selectable = false, selectionWidth = 40 }) {
  return (
    <colgroup>
      {selectable && <col style={{ width: selectionWidth }} />}
      {columns.map((col) => (
        <col key={col.key} style={{ width: col.width || 160 }} />
      ))}
    </colgroup>
  );
}
