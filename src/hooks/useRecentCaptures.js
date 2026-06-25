import { useState, useEffect, useCallback } from 'react';
import capturedLeadsController from 'src/core/controllers/capturedLeadsController.js';

/**
 * Fetches the most recent captures (latest session, newest first).
 * Supports pagination for viewing all records.
 */
export function useRecentCaptures(limit = 100) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 100,
    skip: 0,
    total: 0,
    pages: 0,
    hasMore: false,
  });

  const fetchRecentCaptures = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const fetchLimit = options.limit ?? limit;
      const fetchSkip = options.skip ?? 0;

      const { profiles: list, pagination: pag } =
        await capturedLeadsController.getRecentCaptures({
          limit: fetchLimit,
          skip: fetchSkip,
        });

      setProfiles(list);
      setPagination({
        limit: pag.limit,
        skip: pag.skip,
        total: pag.total,
        pages: pag.pages,
        hasMore: pag.hasMore,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to fetch recent captures';
      setError(message);
      setProfiles([]);
      console.error('[useRecentCaptures] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentCaptures({ limit });
  }, []);

  const goToPage = useCallback((pageNum) => {
    const newSkip = (pageNum - 1) * pagination.limit;
    fetchRecentCaptures({ skip: newSkip, limit: pagination.limit });
  }, [pagination.limit, fetchRecentCaptures]);

  const setPageSize = useCallback((newLimit) => {
    fetchRecentCaptures({ limit: newLimit, skip: 0 });
  }, [fetchRecentCaptures]);

  const refresh = useCallback(() => {
    fetchRecentCaptures({ skip: 0, limit: pagination.limit });
  }, [pagination.limit, fetchRecentCaptures]);

  return {
    profiles,
    loading,
    error,
    pagination,
    goToPage,
    setPageSize,
    refresh,
    currentPage: Math.floor(pagination.skip / pagination.limit) + 1,
    totalPages: pagination.pages || Math.ceil(pagination.total / pagination.limit),
  };
}
