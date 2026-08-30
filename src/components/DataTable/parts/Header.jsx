import { useState } from 'react';
import { HeaderCell } from './HeaderCell';
import { SelectionCheckbox } from './SelectionCheckbox';
import { resolveDensity } from 'src/ui/tokens';
import { moveColumn, shiftColumn } from '../columnOrder';

/**
 * Drag state lives here rather than in DataTable.
 *
 * It is pure interaction bookkeeping - which column is in the air, which edge
 * it is hovering - and it changes on every pointer move. Keeping it in the
 * <thead> means a drag repaints the header, not the body: a table showing 100
 * rows does not re-render a single cell while the user drags.
 */
export function Header({
  columns = [],
  selectable = false,
  sort = {},
  onSort,
  allSelected = false,
  someSelected = false,
  onToggleAll,
  density = 'default',
  sticky = true,
  reorderable = false,
  onReorder,
}) {
  const d = resolveDensity(density);
  const [dragKey, setDragKey] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { key, before }

  const clearDrag = () => {
    setDragKey(null);
    setDropTarget(null);
  };

  const handleDragStart = (event, column) => {
    setDragKey(column.key);
    event.dataTransfer.effectAllowed = 'move';
    /* Firefox ignores a drag that carries no payload. The value is never read
       back - the dragged key is component state - but it has to be set. */
    try {
      event.dataTransfer.setData('text/plain', column.key);
    } catch {
      /* older browsers throw on setData outside a real drag; harmless */
    }
  };

  const handleDragOver = (event, column) => {
    if (!dragKey || column.locked || column.key === dragKey) {
      setDropTarget(null);
      return;
    }
    // Signals "this is a valid drop"; without it the browser refuses the drop
    // and shows the no-entry cursor.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientX < rect.left + rect.width / 2;
    setDropTarget((prev) =>
      prev && prev.key === column.key && prev.before === before ? prev : { key: column.key, before }
    );
  };

  const handleDrop = (event, column) => {
    event.preventDefault();
    if (dragKey && !column.locked && column.key !== dragKey) {
      const before = dropTarget?.key === column.key ? dropTarget.before : true;
      onReorder?.(moveColumn(columns, dragKey, column.key, before));
    }
    clearDrag();
  };

  /**
   * Keyboard path. Alt rather than Ctrl or Cmd: Ctrl+Arrow is a screen-reader
   * navigation command and Cmd+Arrow scrolls the page.
   */
  const handleKeyDown = (event, column) => {
    if (!event.altKey) return;
    const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    onReorder?.(shiftColumn(columns, column.key, delta));
  };

  return (
    <thead className={sticky ? 'sticky top-0 z-[2]' : undefined}>
      <tr
        onDragLeave={
          reorderable
            ? (event) => {
                /* dragleave fires on every cell boundary as the pointer crosses
                   the header. Only a leave that actually exits the row should
                   clear the indicator, otherwise it strobes. */
                if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
              }
            : undefined
        }
      >
        {selectable && (
          <th
            scope="col"
            className="bg-[var(--ui-surface-card)] border-b border-[var(--ui-border)]"
            style={{ height: d.header, padding: `0 ${d.padX}px` }}
          >
            <div className="flex items-center h-full">
              <SelectionCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleAll}
                label="Select all rows on this page"
              />
            </div>
          </th>
        )}
        {columns.map((column) => (
          <HeaderCell
            key={column.key}
            column={column}
            sort={sort}
            onSort={onSort}
            density={density}
            reorderable={reorderable}
            isDragging={reorderable && dragKey === column.key}
            dropEdge={
              reorderable && dropTarget?.key === column.key
                ? dropTarget.before
                  ? 'before'
                  : 'after'
                : null
            }
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={clearDrag}
            onKeyDown={handleKeyDown}
          />
        ))}
      </tr>
    </thead>
  );
}
