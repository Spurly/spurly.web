import { useState, useEffect, useCallback } from 'react';
import campaignsController from 'src/core/controllers/campaignsController.js';

/**
 * Fetches the user's campaign list (each with { stats: { total, completed } }).
 */
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await campaignsController.listCampaigns();
      setCampaigns(list);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, refresh: fetchCampaigns };
}
