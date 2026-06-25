import { useState, useEffect, useCallback, useRef } from 'react';
import capturedLeadsController from 'src/core/controllers/capturedLeadsController.js';

export function useAllProfiles() {
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

  // Tracks the last-used fetch options so goToPage / setPageSize
  // preserve the active connectionDegree filter across pagination.
  const lastOptionsRef = useRef({ limit: 100, skip: 0 });

  const fetchAllProfiles = useCallback(async (options = {}) => {
    const opts = { ...options };
    lastOptionsRef.current = opts;
    setLoading(true);
    setError(null);

    try {
      const { profiles: list, pagination: pag } =
        await capturedLeadsController.getAllProfiles(opts);

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
        err.response?.data?.message || err.message || 'Failed to fetch profiles';
      setError(message);
      setProfiles([]);
      console.error('[useAllProfiles] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProfiles({ limit: 100, skip: 0 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback((pageNum) => {
    const skip = (pageNum - 1) * lastOptionsRef.current.limit;
    fetchAllProfiles({ ...lastOptionsRef.current, skip });
  }, [fetchAllProfiles]);

  const setPageSize = useCallback((newLimit) => {
    fetchAllProfiles({ ...lastOptionsRef.current, limit: newLimit, skip: 0 });
  }, [fetchAllProfiles]);

  const refresh = useCallback(() => {
    fetchAllProfiles({ ...lastOptionsRef.current, skip: 0 });
  }, [fetchAllProfiles]);

  return {
    profiles,
    loading,
    error,
    pagination,
    fetchAllProfiles,
    goToPage,
    setPageSize,
    refresh,
    currentPage: Math.floor(pagination.skip / pagination.limit) + 1,
    totalPages: pagination.pages || Math.ceil(pagination.total / pagination.limit),
  };
}
