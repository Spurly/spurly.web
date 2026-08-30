import { SortIcon } from './SortIcon';
import { resolveDensity } from 'src/ui/tokens';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };
const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

/**
 * Typography lives on the inner element, not the <th>.
 *
 * It used to sit on the <th> and be inherited - which silently produced two
 * different-looking headers, because a sortable column renders its label inside
 * a <button> and a plain one doesn't. Setting it on the content guarantees both
 * branches render identically.
 *
 * Sentence case, not uppercase micro-caps. Letter-spaced all-caps headers are
 * the single most dating detail in a data table.
 */
const LABEL = 'text-[11px] font-medium text-[var(--ui-text-tertiary)]';

/**
 * REORDERING
 *
 * The <th> itself is the drag handle rather than a separate grip affordance:
 * a grip would need permanent space in a 40px band that is already tight, and
 * every table users compare this to (Airtable, Linear, Notion) drags the whole
 * header. Sorting still works because a click without movement never becomes a
 * drag.
 *
 * The drop indicator is a hairline on the leading or trailing edge of the
 * column being hovered, not a ghost of the dragged column. It answers the only
 * question the user has mid-drag - where will this land - in one pixel column.
 */
export function HeaderCell({
  column = {},
  sort = {},
  onSort,
  density = 'default',
  reorderable = false,
  isDragging = false,
  dropEdge = null, // 'before' | 'after' | null
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onKeyDown,
}) {
  const d = resolveDensity(density);
  const active = sort.key === column.key;
  const draggable = reorderable && !column.locked;

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
      draggable={draggable || undefined}
      tabIndex={draggable && !column.sortable ? 0 : undefined}
      title={draggable ? 'Drag to reorder (or Alt + arrow keys)' : undefined}
      onDragStart={draggable ? (e) => onDragStart?.(e, column) : undefined}
      onDragOver={reorderable ? (e) => onDragOver?.(e, column) : undefined}
      onDrop={reorderable ? (e) => onDrop?.(e, column) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onKeyDown={draggable ? (e) => onKeyDown?.(e, column) : undefined}
      className={[
        'relative whitespace-nowrap bg-[var(--ui-surface-card)] border-b border-[var(--ui-border)]',
        ALIGN[column.align] || ALIGN.left,
        draggable ? 'cursor-grab active:cursor-grabbing select-none' : '',
        isDragging ? 'opacity-40' : '',
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

      {dropEdge && (
        <span
          aria-hidden="true"
          className={[
            'absolute top-0 bottom-0 w-[2px] bg-[var(--ui-accent-fg)] pointer-events-none',
            dropEdge === 'before' ? 'left-0' : 'right-0',
          ].join(' ')}
        />
      )}
    </th>
  );
}
