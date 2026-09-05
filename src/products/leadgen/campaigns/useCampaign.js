import { useState, useEffect, useCallback } from 'react';
import campaignsController from 'src/products/leadgen/campaigns/controller.js';
import { useErrorToast } from 'src/ui/primitives';

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

  /* Reported twice on purpose: the inline block the page renders (which
     persists next to the empty table) and one toast (which catches the eye
     if that block is off screen). The toast gets fixed copy — the server's
     text goes inline, where there's room for it. */
  useErrorToast(error, "Couldn't load this campaign");

  return { campaign, members, loading, error, refresh: fetchCampaign, update };
}
