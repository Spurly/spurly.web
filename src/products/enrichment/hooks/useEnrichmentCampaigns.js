import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import enrichmentCampaignController from '../controller/campaign.js';
import { POLL_MS, ENRICHMENT_EVENTS } from '../constants/constants.js';

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
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(() => {
    enrichmentCampaignController.listEnrichmentCampaigns(eventEmitter);
  }, [eventEmitter]);

  const remove = useCallback((campaign) => {
    confirm({
      title: 'Remove this enrichment campaign?',
      body: 'This only stops tracking it as a group — any leads it already enriched keep their enriched data.',
      confirmLabel: 'Remove',
    }).then((ok) => {
      if (!ok) return;
      setBusy(true);
      enrichmentCampaignController.deleteEnrichmentCampaign(eventEmitter, campaign._id);
    });
  }, [confirm, eventEmitter]);

  useEffect(() => {
    function handleListSuccess(next) {
      setCampaigns(next);
      setLoading(false);
    }
    function handleListFailure(error) {
      toast.error(getToastError(error, 'Could not load your enrichment campaigns'));
      setLoading(false);
    }
    function handleDeleteSuccess() {
      toast.success('Enrichment campaign removed');
      setBusy(false);
      load();
    }
    function handleDeleteFailure(error) {
      toast.error(getToastError(error, 'Could not remove that campaign'));
      setBusy(false);
    }

    eventEmitter.on(ENRICHMENT_EVENTS.LIST_ENRICHMENT_CAMPAIGNS_SUCCESS, handleListSuccess);
    eventEmitter.on(ENRICHMENT_EVENTS.LIST_ENRICHMENT_CAMPAIGNS_FAILURE, handleListFailure);
    eventEmitter.on(ENRICHMENT_EVENTS.DELETE_ENRICHMENT_CAMPAIGN_SUCCESS, handleDeleteSuccess);
    eventEmitter.on(ENRICHMENT_EVENTS.DELETE_ENRICHMENT_CAMPAIGN_FAILURE, handleDeleteFailure);

    return () => {
      eventEmitter.off(ENRICHMENT_EVENTS.LIST_ENRICHMENT_CAMPAIGNS_SUCCESS, handleListSuccess);
      eventEmitter.off(ENRICHMENT_EVENTS.LIST_ENRICHMENT_CAMPAIGNS_FAILURE, handleListFailure);
      eventEmitter.off(ENRICHMENT_EVENTS.DELETE_ENRICHMENT_CAMPAIGN_SUCCESS, handleDeleteSuccess);
      eventEmitter.off(ENRICHMENT_EVENTS.DELETE_ENRICHMENT_CAMPAIGN_FAILURE, handleDeleteFailure);
    };
  }, [eventEmitter, load, toast]);

  useEffect(() => { load(); }, [load]);

  const anyLive = campaigns.some(isLive);
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [anyLive, load]);

  return { campaigns, loading, busy, remove };
}
