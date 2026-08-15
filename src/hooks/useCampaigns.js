import { useState, useEffect, useCallback } from 'react';
import campaignsController from 'src/core/controllers/campaignsController.js';
import { useErrorToast } from 'src/ui/primitives';

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

  /* Reported twice on purpose: the inline block the page renders (which
     persists next to the empty table) and one toast (which catches the eye
     if that block is off screen). The toast gets fixed copy — the server's
     text goes inline, where there's room for it. */
  useErrorToast(error, "Couldn't load your campaigns");

  return { campaigns, loading, error, refresh: fetchCampaigns };
}
