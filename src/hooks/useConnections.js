import { useState, useEffect, useCallback, useRef } from 'react';
import connectionsController from 'src/core/controllers/connectionsController.js';
import { useErrorToast } from 'src/ui/primitives';

/**
 * Paginated read of the user's LinkedIn connections.
 *
 * Mirrors useAllProfiles, minus everything outreach-related: connections carry
 * no status, no campaign membership and no send budget.
 */
export function useConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 100,
    skip: 0,
    total: 0,
    pages: 0,
    hasMore: false,
  });

  // Tracks the last-used fetch options so goToPage / setPageSize preserve the
  // active search and sort across pagination.
  const lastOptionsRef = useRef({ limit: 100, skip: 0 });

  const fetchConnections = useCallback(async (options = {}) => {
    const opts = { ...options };
    lastOptionsRef.current = opts;
    setLoading(true);
    setError(null);

    try {
      const { connections: list, pagination: pag } =
        await connectionsController.getConnections(opts);

      setConnections(list);
      setPagination({
        limit: pag.limit,
        skip: pag.skip,
        total: pag.total,
        pages: pag.pages,
        hasMore: pag.hasMore,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to fetch connections';
      setError(message);
      setConnections([]);
      console.error('[useConnections] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections({ limit: 100, skip: 0 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback(
    (pageNum) => {
      const skip = (pageNum - 1) * lastOptionsRef.current.limit;
      fetchConnections({ ...lastOptionsRef.current, skip });
    },
    [fetchConnections],
  );

  const setPageSize = useCallback(
    (newLimit) => {
      fetchConnections({ ...lastOptionsRef.current, limit: newLimit, skip: 0 });
    },
    [fetchConnections],
  );

  const refresh = useCallback(() => {
    fetchConnections({ ...lastOptionsRef.current, skip: 0 });
  }, [fetchConnections]);

  /* Reported twice on purpose: the inline block the page renders (which
     persists next to the empty table) and one toast (which catches the eye
     if that block is off screen). The toast gets fixed copy — the server's
     text goes inline, where there's room for it. */
  useErrorToast(error, "Couldn't load your connections");

  return {
    connections,
    loading,
    error,
    pagination,
    fetchConnections,
    goToPage,
    setPageSize,
    refresh,
    currentPage: Math.floor(pagination.skip / pagination.limit) + 1,
    totalPages: pagination.pages || Math.ceil(pagination.total / pagination.limit),
  };
}
