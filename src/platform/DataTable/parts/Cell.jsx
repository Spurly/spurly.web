import { resolveDensity } from 'src/ui/tokens';

const ALIGN = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

/**
 * THE CELL CONTRACT.
 *
 * Truncation lives here, not in the individual cell components. That single
 * decision is what fixes the old table's ragged row heights: previously
 * AvatarNameCell and CompanyCell truncated, TextCell and SkillsCell didn't, so
 * whether a column behaved depended on which cell a page author happened to
 * pick. Now every column in every table clamps, whether or not the cell
 * component remembered to.
 *
 *   - height is fixed by the density token, never by padding
 *   - content is single line with an ellipsis
 *   - the full value goes on `title`, so nothing is lost to truncation
 *   - `column.wrap` opts into two lines and still clamps
 */
export function Cell({ row = {}, column = {}, density = 'default' }) {
  const d = resolveDensity(density);
  const raw = row[column.key];
  const content = column.render ? column.render(raw, row) : raw;

  const derivedTitle =
    typeof column.title === 'function'
      ? column.title(row)
      : typeof raw === 'string' || typeof raw === 'number'
        ? String(raw)
        : undefined;

  return (
    <td
      data-column-id={column.key}
      className={`border-b border-[var(--ui-border-hairline)] ${column.cellClassName || ''}`}
      style={{ height: d.row, padding: `0 ${d.padX}px`, fontSize: d.fontSize }}
    >
      <div
        title={derivedTitle || undefined}
        className={[
          'flex items-center h-full min-w-0 overflow-hidden text-[var(--ui-text-primary)]',
          ALIGN[column.align] || ALIGN.left,
        ].join(' ')}
      >
        <span
          className={
            column.wrap
              ? 'min-w-0 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] leading-[1.35]'
              : 'min-w-0 truncate'
          }
          style={{ width: '100%', textAlign: column.align || 'left' }}
        >
          {content ?? <span className="text-[var(--ui-text-quaternary)]">—</span>}
        </span>
      </div>
    </td>
  );
}
