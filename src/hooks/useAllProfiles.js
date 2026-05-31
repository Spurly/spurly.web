import { useState, useEffect, useCallback } from 'react';
import capturedLeadsController from 'src/capturedleads/controllers/capturedLeadsController.js';

/**
 * Custom hook for fetching ALL profiles across all user sessions.
 * Talks to the CapturedLeads controller (not the API directly).
 */
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

  const fetchAllProfiles = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const limit = options.limit ?? 100;
      const skip = options.skip ?? 0;

      const { profiles: list, pagination: pag } =
        await capturedLeadsController.getAllProfiles({ limit, skip });

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
    fetchAllProfiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback((pageNum) => {
    const newSkip = (pageNum - 1) * pagination.limit;
    fetchAllProfiles({ skip: newSkip });
  }, [pagination.limit, fetchAllProfiles]);

  const setPageSize = useCallback((newLimit) => {
    fetchAllProfiles({ limit: newLimit, skip: 0 });
  }, [fetchAllProfiles]);

  const refresh = useCallback(() => {
    fetchAllProfiles({ skip: 0 });
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
