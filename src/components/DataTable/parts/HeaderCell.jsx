import { SortIcon } from './SortIcon';
import { resolveDensity } from 'src/ui/tokens';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };
const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

/**
 * Typography lives on the inner element, not the <th>.
 *
 * It used to sit on the <th> and be inherited — which silently produced two
 * different-looking headers, because a sortable column renders its label inside
 * a <button> and a plain one doesn't. Setting it on the content guarantees both
 * branches render identically.
 *
 * Sentence case, not uppercase micro-caps. Letter-spaced all-caps headers are
 * the single most dating detail in a data table.
 */
const LABEL = 'text-[11px] font-medium text-[var(--ui-text-tertiary)]';

export function HeaderCell({ column = {}, sort = {}, onSort, density = 'default' }) {
  const d = resolveDensity(density);
  const active = sort.key === column.key;

  const ariaSort = !column.sortable
    ? undefined
    : active
      ? sort.direction === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none';

  return (
    <th
      scope="col"
      data-column-id={column.key}
      aria-sort={ariaSort}
      className={[
        'whitespace-nowrap bg-[var(--ui-surface-card)] border-b border-[var(--ui-border)]',
        ALIGN[column.align] || ALIGN.left,
        column.headerClassName || '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: d.header, padding: `0 ${d.padX}px` }}
    >
      {column.sortable ? (
        <button
          type="button"
          onClick={() => onSort?.(column.key)}
          className={[
            'group/sort inline-flex items-center gap-1 w-full',
            JUSTIFY[column.align] || JUSTIFY.left,
            LABEL,
            'hover:text-[var(--ui-text-secondary)] transition-colors',
            'focus:outline-none focus-visible:text-[var(--ui-accent-fg)]',
          ].join(' ')}
        >
          {column.label}
          <SortIcon active={active} direction={sort.direction} />
        </button>
      ) : (
        <span className={`inline-flex items-center ${LABEL}`}>{column.label}</span>
      )}
    </th>
  );
}
