import { Skeleton } from 'src/ui/primitives';
import { resolveDensity } from 'src/ui/tokens';

/* Varied widths so a loading table reads as content, not as a barcode. */
const WIDTHS = ['70%', '45%', '85%', '55%', '65%', '40%', '75%'];

export function SkeletonRow({ index = 0, columns = [], selectable = false, density = 'default' }) {
  const d = resolveDensity(density);

  return (
    <tr style={{ height: d.row }}>
      {selectable && (
        <td className="border-b border-[var(--ui-border-hairline)]" style={{ padding: `0 ${d.padX}px` }}>
          <Skeleton width={15} height={15} />
        </td>
      )}
      {columns.map((column, i) => (
        <td
          key={column.key}
          className="border-b border-[var(--ui-border-hairline)]"
          style={{ padding: `0 ${d.padX}px` }}
        >
          <Skeleton width={WIDTHS[(index + i) % WIDTHS.length]} height={9} />
        </td>
      ))}
    </tr>
  );
}
