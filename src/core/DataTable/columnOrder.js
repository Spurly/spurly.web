/**
 * Column ordering helpers.
 *
 * Order is stored as an array of column KEYS, never indexes. Indexes rot the
 * moment a column is added to or removed from a definition file - a user who
 * reordered the People table in March would silently get a scrambled table in
 * April. Keys degrade gracefully in both directions:
 *
 *   - a saved key that no longer exists is ignored
 *   - a new column missing from the saved order falls back to its default slot
 *
 * A column with `locked: true` never moves. It keeps the index it has in the
 * definition file, whatever a saved order says, so identity columns stay at
 * the left edge where the row stays readable while scrolling sideways.
 */

/**
 * Apply a saved key order to a column definition array.
 *
 * @param {Array}    columns  default column definitions
 * @param {string[]} order    saved column keys, in display order
 * @returns {Array}  columns in display order (same objects, new array)
 */
export function applyColumnOrder(columns = [], order) {
  if (!Array.isArray(order) || order.length === 0) return columns;

  const pinned = [];
  const movable = [];
  columns.forEach((column, index) => {
    if (column.locked) pinned.push({ column, index });
    else movable.push(column);
  });

  const byKey = new Map(movable.map((column) => [column.key, column]));
  const placed = new Set();
  const sequence = [];

  for (const key of order) {
    const column = byKey.get(key);
    if (column && !placed.has(key)) {
      sequence.push(column);
      placed.add(key);
    }
  }

  // Columns the saved order never heard of - added to the definition since it
  // was written - slot back in at their default rank rather than piling up at
  // the end, so a new column appears where its author put it.
  movable.forEach((column, defaultIndex) => {
    if (!placed.has(column.key)) {
      sequence.splice(Math.min(defaultIndex, sequence.length), 0, column);
    }
  });

  // Re-pin locked columns at their definition indexes. Ascending, so each one
  // lands before the next is measured.
  const result = sequence;
  pinned.forEach(({ column, index }) => {
    result.splice(Math.min(index, result.length), 0, column);
  });

  return result;
}

/**
 * Move one column relative to another, returning the new key order.
 *
 * @param {Array}   columns  columns in their CURRENT display order
 * @param {string}  fromKey  the dragged column
 * @param {string}  toKey    the column dropped onto
 * @param {boolean} before   drop on the leading edge of `toKey`
 * @returns {string[]} the full key order after the move
 */
export function moveColumn(columns = [], fromKey, toKey, before) {
  const keys = columns.map((column) => column.key);
  if (fromKey === toKey || !keys.includes(fromKey) || !keys.includes(toKey)) {
    return keys;
  }

  const without = keys.filter((key) => key !== fromKey);
  const target = without.indexOf(toKey);
  without.splice(before ? target : target + 1, 0, fromKey);
  return without;
}

/**
 * Shift a column one slot left or right, skipping over locked columns.
 * Backs the keyboard path (Alt + Arrow), which is the only way to reorder
 * without a pointing device.
 *
 * @param {Array}  columns  columns in their CURRENT display order
 * @param {string} key      the column to move
 * @param {number} delta    -1 (left) or 1 (right)
 * @returns {string[]} the full key order after the move
 */
export function shiftColumn(columns = [], key, delta) {
  const index = columns.findIndex((column) => column.key === key);
  if (index < 0 || columns[index].locked) return columns.map((c) => c.key);

  // Walk past neighbours that cannot be displaced.
  let target = index + delta;
  while (target >= 0 && target < columns.length && columns[target].locked) {
    target += delta;
  }
  if (target < 0 || target >= columns.length) return columns.map((c) => c.key);

  return moveColumn(columns, key, columns[target].key, delta < 0);
}

/**
 * Has the user actually changed anything? Drives whether a "reset" affordance
 * is worth showing.
 */
export function isCustomOrder(columns = [], order) {
  if (!Array.isArray(order) || order.length === 0) return false;
  const applied = applyColumnOrder(columns, order).map((c) => c.key);
  return applied.join(' ') !== columns.map((c) => c.key).join(' ');
}
