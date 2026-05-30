import { useState, useEffect, useCallback } from 'react';
import profilesApi from '../api/profilesApi.js';

/**
 * Custom hook for fetching ALL profiles across all user sessions
 * Uses the optimized /api/profiles/all endpoint
 * Includes full session data with each profile
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

  // Fetch all profiles from backend
  const fetchAllProfiles = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const limit = options.limit || pagination.limit;
      const skip = options.skip || pagination.skip;

      const response = await profilesApi.getAllProfiles({ limit, skip });

      if (response.success && response.data) {
        setProfiles(response.data.profiles || []);
        if (response.data.pagination) {
          setPagination({
            limit: response.data.pagination.limit,
            skip: response.data.pagination.skip,
            total: response.data.pagination.total,
            pages: response.data.pagination.pages,
            hasMore: response.data.pagination.hasMore,
          });
        }
      } else {
        setError(response.message || 'Failed to fetch profiles');
        setProfiles([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profiles';
      setError(errorMessage);
      console.error('[useAllProfiles] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.skip]);

  // Fetch profiles on mount
  useEffect(() => {
    fetchAllProfiles();
  }, []);

  // Change page
  const goToPage = useCallback((pageNum) => {
    const newSkip = (pageNum - 1) * pagination.limit;
    fetchAllProfiles({ skip: newSkip });
  }, [pagination.limit, fetchAllProfiles]);

  // Change items per page
  const setPageSize = useCallback((newLimit) => {
    fetchAllProfiles({ limit: newLimit, skip: 0 });
  }, [fetchAllProfiles]);

  // Refresh profiles
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
