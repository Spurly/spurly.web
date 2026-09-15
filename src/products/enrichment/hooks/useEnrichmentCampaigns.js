import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import enrichmentCampaignController from '../controller/campaign.js';
import { POLL_MS } from '../constants.js';

/** Only a running campaign has anything new to report. */
export const isLive = (c) => c?.status === 'running';

/**
 * All state for the enrichment campaigns list page: the list itself, polling
 * while anything is still running, and the one row action (remove).
 *
 * `remove` owns its own confirmation dialog, same shape as
 * `campaigns/hooks/useCampaigns.js#remove` — a page just does
 * `onDelete={remove}` and never has to know a confirm step exists.
 */
export function useEnrichmentCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  const mountedRef = useRef(true);
  // Set on every mount, not only cleared on unmount — see useCampaigns.js's
  // identical comment for why a cleanup-only version breaks under StrictMode.
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => enrichmentCampaignController.listEnrichmentCampaigns()
    .then((next) => { if (mountedRef.current) setCampaigns(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load your enrichment campaigns')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [toast]);

  useEffect(() => { load(); }, [load]);

  const anyLive = campaigns.some(isLive);
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const remove = async (campaign) => {
    const ok = await confirm({
      title: 'Remove this enrichment campaign?',
      body: 'This only stops tracking it as a group — any leads it already enriched keep their enriched data.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await enrichmentCampaignController.deleteEnrichmentCampaign(campaign._id);
      toast.success('Enrichment campaign removed');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not remove that campaign'));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  return { campaigns, loading, busy, remove };
}
