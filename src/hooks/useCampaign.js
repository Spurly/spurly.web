import { useState, useEffect, useCallback } from 'react';
import campaignsController from 'src/core/controllers/campaignsController.js';

/**
 * Fetches a single campaign + its members, and exposes an update helper.
 */
export function useCampaign(campaignId) {
  const [campaign, setCampaign] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const { campaign: c, members: m } = await campaignsController.getCampaign(campaignId);
      setCampaign(c);
      setMembers(m);
    } catch (err) {
      setError(err.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const update = useCallback(
    async (patch) => {
      const updated = await campaignsController.updateCampaign(campaignId, patch);
      setCampaign((prev) => ({ ...prev, ...updated }));
      return updated;
    },
    [campaignId],
  );

  return { campaign, members, loading, error, refresh: fetchCampaign, update };
}
