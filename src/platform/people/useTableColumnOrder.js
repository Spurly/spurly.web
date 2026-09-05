import { useCallback, useMemo, useState } from 'react';
import { useAuth } from 'src/platform/auth/useAuth';
import { isCustomOrder } from 'src/platform/DataTable';

/**
 * Server-persisted column order for one DataTable.
 *
 * Order lives on the user record (`user.tablePreferences[tableId].columnOrder`)
 * rather than in localStorage, so it follows the person between their laptop
 * and any other machine they sign in on. It arrives with `/auth/me` on boot,
 * which is why there is no fetch here and no loading state to render around:
 * by the time a table mounts the order is already known.
 *
 * Writes are optimistic. A drag has to feel instant, and the failure case -
 * the save request losing - is a column that snaps back on the next reload,
 * not lost data. A failed save is surfaced through `error` so the caller can
 * mention it if it wants; nothing here blocks the interaction.
 *
 * @param {string} tableId  stable id for this table, e.g. "people"
 * @param {Array}  columns  the DEFAULT column definitions
 */
export function useTableColumnOrder(tableId, columns = []) {
  const { user, saveTableColumnOrder, resetTableColumnOrder } = useAuth();

  const savedOrder = user?.tablePreferences?.[tableId]?.columnOrder ?? null;

  // Pending local order, held only between the drag and the server catching
  // up. Null means "whatever the user record says".
  const [pendingOrder, setPendingOrder] = useState(null);
  const [error, setError] = useState(null);

  const columnOrder = pendingOrder ?? savedOrder;

  const onColumnOrderChange = useCallback(
    (nextKeys) => {
      setPendingOrder(nextKeys);
      setError(null);
      saveTableColumnOrder?.(tableId, nextKeys)
        .then(() => setPendingOrder(null))
        .catch((err) => {
          console.warn('Could not save column order:', err);
          setError('Column order could not be saved');
        });
    },
    [tableId, saveTableColumnOrder]
  );

  const resetColumnOrder = useCallback(() => {
    setPendingOrder([]);
    setError(null);
    resetTableColumnOrder?.(tableId)
      .then(() => setPendingOrder(null))
      .catch((err) => {
        console.warn('Could not reset column order:', err);
        setError('Column order could not be reset');
      });
  }, [tableId, resetTableColumnOrder]);

  const isCustomized = useMemo(
    () => isCustomOrder(columns, columnOrder),
    [columns, columnOrder]
  );

  return { columnOrder, onColumnOrderChange, resetColumnOrder, isCustomized, error };
}
