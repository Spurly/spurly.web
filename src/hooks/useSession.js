import { useState, useEffect, useCallback } from 'react';
import sessionsApi from 'src/api/sessionsApi.js';

/**
 * Custom hook for managing sessions
 * Gets or creates a default session for the user
 */
export function useSession() {
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get or create default session
  const getOrCreateSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try to get existing sessions
      const listResponse = await sessionsApi.listSessions({ limit: 1 });

      if (listResponse.success && listResponse.data?.sessions?.length > 0) {
        // Use the first (most recent) session
        const defaultSession = listResponse.data.sessions[0];
        setSession(defaultSession);
        setSessions(listResponse.data.sessions);
      } else {
        // No sessions exist, create a default one
        const createResponse = await sessionsApi.createSession({
          name: 'Default Session',
          description: 'Default session for captured leads',
          status: 'active',
        });

        if (createResponse.success && createResponse.data) {
          setSession(createResponse.data);
          setSessions([createResponse.data]);
        } else {
          setError(createResponse.message || 'Failed to create session');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get/create session';
      setError(errorMessage);
      console.error('[useSession] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load session on mount
  useEffect(() => {
    getOrCreateSession();
  }, [getOrCreateSession]);

  return {
    session,
    sessions,
    loading,
    error,
    getOrCreateSession,
    sessionId: session?.id || session?._id,
  };
}
