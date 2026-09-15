import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import enrichmentCampaignController from '../controller/campaign.js';
import { POLL_MS } from '../constants.js';

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

  const load = useCallback(() => enrichmentCampaignController.getEnrichmentCampaign(id)
    .then((next) => { if (mountedRef.current) setData(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load that campaign')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [id, toast]);

  const loadLeads = useCallback((page = 1) => enrichmentCampaignController
    .listLeads(id, { status: statusFilter || undefined, page })
    .then((res) => {
      if (!mountedRef.current) return;
      setLeads(res.leads ?? []);
      setPagination(res.pagination ?? { page, limit: 50, total: 0 });
    })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load leads')); }), [id, statusFilter, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadLeads(1); }, [loadLeads]);

  const campaign = data?.campaign ?? null;
  const running = data?.status === 'running';

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { load().then(() => loadLeads(pagination.page)); }, POLL_MS);
    return () => clearInterval(t);
  }, [running, load, loadLeads, pagination.page]);

  const retryFailed = async () => {
    setBusy(true);
    try {
      const result = await enrichmentCampaignController.retryFailed(id);
      toast.success(`${result.requeued} queued again`);
      await load();
      await loadLeads(pagination.page);
    } catch (err) {
      toast.error(getToastError(err, 'Could not queue those again'));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

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
