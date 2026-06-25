import { useState, useEffect, useCallback } from 'react';
import apiGateway from 'src/core/gateway/apiGateway.js';

/**
 * Fetches dashboard metrics (leads captured, enriched, verified emails).
 * Compares this week vs last week with percentage change.
 */
export function useMetrics() {
  const [metrics, setMetrics] = useState({
    leadsCapture: { thisWeek: 0, lastWeek: 0, percentageChange: 0 },
    enriched: { thisWeek: 0, lastWeek: 0, percentageChange: 0 },
    verifiedEmails: { thisWeek: 0, lastWeek: 0, percentageChange: 0 },
    sessions: { thisWeek: 0, lastWeek: 0, percentageChange: 0, total: 0, active: 0 },
    connectionDegrees: { first: 0, second: 0, third: 0, unknown: 0 },
    topTitles: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiGateway.get('/profiles/statistics');
      const data = response.data;

      if (data?.success && data?.data?.statistics) {
        setMetrics(data.data.statistics);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to fetch metrics';
      setError(message);
      console.error('[useMetrics] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh };
}
