import { useState, useEffect, useCallback } from 'react';
import capturedLeadsController from 'src/capturedleads/controllers/capturedLeadsController.js';

/**
 * Custom hook for fetching profiles for a single session.
 * Talks to the CapturedLeads controller (not the API directly).
 */
export function useProfiles(sessionId) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ limit: 50, skip: 0, total: 0, pages: 0, hasMore: false });

  const fetchProfiles = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await capturedLeadsController.getProfilesBySession(sessionId);
      if (response?.success && response?.data) {
        setProfiles(response.data.profiles || []);
        if (response.data.pagination) setPagination(response.data.pagination);
      } else {
        setError(response?.message || 'Failed to fetch profiles');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  return { profiles, loading, error, pagination, fetchProfiles, refresh: fetchProfiles };
}
