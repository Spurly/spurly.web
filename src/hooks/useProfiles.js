import { useState, useEffect, useCallback } from 'react';
import profilesApi from '../api/profilesApi.js';

/**
 * Custom hook for managing profiles/leads
 * Handles fetching, caching, pagination, and filtering
 */
export function useProfiles(sessionId) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    skip: 0,
    total: 0,
  });

  // Fetch profiles from API
  const fetchProfiles = useCallback(async (options = {}) => {
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const limit = options.limit || pagination.limit;
      const skip = options.skip || pagination.skip;

      const response = await profilesApi.getSessionProfiles(sessionId, { limit, skip });

      if (response.success && response.data) {
        setProfiles(response.data.profiles || []);
        if (response.data.pagination) {
          setPagination({
            limit: response.data.pagination.limit,
            skip: response.data.pagination.skip,
            total: response.data.pagination.total,
          });
        }
      } else {
        setError(response.message || 'Failed to fetch profiles');
        setProfiles([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profiles';
      setError(errorMessage);
      console.error('[useProfiles] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, pagination.limit, pagination.skip]);

  // Fetch profiles on mount or when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchProfiles();
    }
  }, [sessionId, fetchProfiles]);

  // Change page
  const goToPage = useCallback((pageNum) => {
    const newSkip = (pageNum - 1) * pagination.limit;
    fetchProfiles({ skip: newSkip });
  }, [pagination.limit, fetchProfiles]);

  // Change items per page
  const setPageSize = useCallback((newLimit) => {
    fetchProfiles({ limit: newLimit, skip: 0 });
  }, [fetchProfiles]);

  // Refresh profiles
  const refresh = useCallback(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    pagination,
    fetchProfiles,
    goToPage,
    setPageSize,
    refresh,
    currentPage: Math.floor(pagination.skip / pagination.limit) + 1,
    totalPages: Math.ceil(pagination.total / pagination.limit),
  };
}
