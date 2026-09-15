import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import enrichmentCampaignController from '../controller/campaign.js';
import { POLL_MS, ENRICHMENT_EVENTS } from '../constants/constants.js';

/**
 * All state for one enrichment campaign's detail page: the envelope
 * (campaign + counts + status), its leads table with its own pagination and
 * status filter, and retrying whatever failed.
 *
 * Reads `:id` from the route itself — same reasoning as
 * `campaigns/hooks/useCampaignDetail.js`, this hook only ever makes sense
 * mounted under `/hub/enrichment/:id`.
 */
export function useEnrichmentCampaignDetail() {
  const { id } = useParams();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [data, setData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => {
    enrichmentCampaignController.getEnrichmentCampaign(eventEmitter, id);
  }, [eventEmitter, id]);

  const loadLeads = useCallback((page = 1) => {
    enrichmentCampaignController.listLeads(eventEmitter, id, { status: statusFilter || undefined, page });
  }, [eventEmitter, id, statusFilter]);

  const campaign = data?.campaign ?? null;
  const running = data?.status === 'running';

  const retryFailed = useCallback(() => {
    setBusy(true);
    enrichmentCampaignController.retryFailed(eventEmitter, id);
  }, [eventEmitter, id]);

  useEffect(() => {
    function handleGetSuccess(next) {
      if (!mountedRef.current) return;
      setData(next);
      setLoading(false);
    }
    function handleGetFailure(error) {
      if (!mountedRef.current) return;
      toast.error(getToastError(error, 'Could not load that campaign'));
      setLoading(false);
    }
    function handleListLeadsSuccess(res) {
      if (!mountedRef.current) return;
      setLeads(res.leads ?? []);
      setPagination(res.pagination ?? { page: 1, limit: 50, total: 0 });
    }
    function handleListLeadsFailure(error) {
      if (!mountedRef.current) return;
      toast.error(getToastError(error, 'Could not load leads'));
    }
    function handleRetrySuccess(result) {
      toast.success(`${result.requeued} queued again`);
      if (mountedRef.current) setBusy(false);
      load();
      loadLeads(pagination.page);
    }
    function handleRetryFailure(error) {
      toast.error(getToastError(error, 'Could not queue those again'));
      if (mountedRef.current) setBusy(false);
    }

    eventEmitter.on(ENRICHMENT_EVENTS.GET_ENRICHMENT_CAMPAIGN_SUCCESS, handleGetSuccess);
    eventEmitter.on(ENRICHMENT_EVENTS.GET_ENRICHMENT_CAMPAIGN_FAILURE, handleGetFailure);
    eventEmitter.on(ENRICHMENT_EVENTS.LIST_LEADS_SUCCESS, handleListLeadsSuccess);
    eventEmitter.on(ENRICHMENT_EVENTS.LIST_LEADS_FAILURE, handleListLeadsFailure);
    eventEmitter.on(ENRICHMENT_EVENTS.RETRY_FAILED_SUCCESS, handleRetrySuccess);
    eventEmitter.on(ENRICHMENT_EVENTS.RETRY_FAILED_FAILURE, handleRetryFailure);

    return () => {
      eventEmitter.off(ENRICHMENT_EVENTS.GET_ENRICHMENT_CAMPAIGN_SUCCESS, handleGetSuccess);
      eventEmitter.off(ENRICHMENT_EVENTS.GET_ENRICHMENT_CAMPAIGN_FAILURE, handleGetFailure);
      eventEmitter.off(ENRICHMENT_EVENTS.LIST_LEADS_SUCCESS, handleListLeadsSuccess);
      eventEmitter.off(ENRICHMENT_EVENTS.LIST_LEADS_FAILURE, handleListLeadsFailure);
      eventEmitter.off(ENRICHMENT_EVENTS.RETRY_FAILED_SUCCESS, handleRetrySuccess);
      eventEmitter.off(ENRICHMENT_EVENTS.RETRY_FAILED_FAILURE, handleRetryFailure);
    };
  }, [eventEmitter, load, loadLeads, toast, pagination.page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadLeads(1); }, [loadLeads]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { load(); loadLeads(pagination.page); }, POLL_MS);
    return () => clearInterval(t);
  }, [running, load, loadLeads, pagination.page]);

  return {
    data,
    campaign,
    counts: data?.counts ?? {},
    status: data?.status,
    leads,
    pagination,
    statusFilter,
    setStatusFilter,
    loading,
    busy,
    running,
    retryFailed,
    goToPage: loadLeads,
  };
}
