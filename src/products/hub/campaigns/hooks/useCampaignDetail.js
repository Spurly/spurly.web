import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { useAuth } from 'src/platform/auth/hooks/useAuth.js';
import campaignController from '../controller/campaign.js';
import { POLL_MS } from '../constants.js';


/**
 * All state for one campaign's detail page: the campaign envelope (campaign +
 * counts + pacing + sender + account), its members table with its own
 * pagination and status filter, and the action set (start / pause / retry /
 * save note).
 *
 * Reads `:id` from the route itself rather than taking it as a parameter —
 * this hook only ever makes sense mounted under `/hub/campaigns/:id`, so
 * there is no caller that would ever need to pass a different id in.
 */
export function useCampaignDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // The "review before sending" gate for a message campaign — see
  // SendMessagePreviewDialog's own comment for why this exists and a connect
  // campaign deliberately skips it. Members here are a fresh, small sample of
  // real PENDING recipients, fetched only when the dialog opens, never the
  // page's own (possibly filtered, possibly stale) members table.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMembers, setPreviewMembers] = useState([]);

  const toast = useToast();
  const { user } = useAuth();
  const senderName = (user?.name || '').split(' ')[0] || '';
  const mountedRef = useRef(true);
  /**
   * Set on every mount, not only cleared on unmount.
   *
   * StrictMode mounts, unmounts and remounts in development. A cleanup-only
   * version leaves this false for the life of the real mount, so every "am I
   * still on screen?" guard fails, every response is discarded, and the page
   * sits on its loading state over requests that plainly succeeded. It is
   * invisible in production, where the double invoke does not happen — which
   * is exactly what makes it worth a comment.
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => campaignController.getCampaign(id)
    .then((next) => { if (mountedRef.current) setData(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load that campaign')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [id, toast]);

  const loadMembers = useCallback((page = 1) => campaignController
    .listMembers(id, { status: statusFilter || undefined, page })
    .then((res) => {
      if (!mountedRef.current) return;
      setMembers(res.members ?? []);
      setPagination(res.pagination ?? { page, limit: 50, total: 0 });
    })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load members')); }), [id, statusFilter, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMembers(1); }, [loadMembers]);

  const campaign = data?.campaign ?? null;
  const running = campaign?.status === 'running';

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { load().then(() => loadMembers(pagination.page)); }, POLL_MS);
    return () => clearInterval(t);
  }, [running, load, loadMembers, pagination.page]);

  const act = async (fn, okMessage, failMessage) => {
    setBusy(true);
    try {
      const result = await fn();
      toast.success(typeof okMessage === 'function' ? okMessage(result) : okMessage);
      await load();
      await loadMembers(pagination.page);
    } catch (err) {
      toast.error(getToastError(err, failMessage));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const start = () => act(
    () => campaignController.startCampaign(id),
    'Started. Sending is paced through your working hours.',
    'Could not start that campaign',
  );

  /**
   * Opens the review dialog and fetches a fresh, small sample of real
   * pending members to preview against. Fetched fresh rather than reusing
   * the page's own `members` (which may be filtered to "Failed" or another
   * status, or just stale) — the whole point of this dialog is to show who
   * is genuinely about to be messaged.
   */
  const openStartPreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const res = await campaignController.listMembers(id, { status: 'pending', page: 1, limit: 20 });
      if (mountedRef.current) setPreviewMembers(res.members ?? []);
    } catch (err) {
      if (mountedRef.current) {
        setPreviewMembers([]);
        toast.error(getToastError(err, 'Could not load a preview'));
      }
    } finally {
      if (mountedRef.current) setPreviewLoading(false);
    }
  };

  const closeStartPreview = () => {
    if (busy) return; // let `act`'s own busy-lock finish before this can be dismissed
    setPreviewOpen(false);
  };

  const confirmStart = async () => {
    await start();
    if (mountedRef.current) setPreviewOpen(false);
  };

  const pause = () => act(
    () => campaignController.pauseCampaign(id),
    'Paused. Nobody else will be contacted.',
    'Could not pause that campaign',
  );

  const retryFailed = () => act(
    () => campaignController.retryFailed(id),
    (r) => (r.leftAlone
      ? `${r.requeued} queued again. ${r.leftAlone} left alone — those may already have been sent.`
      : `${r.requeued} queued again`),
    'Could not queue those again',
  );

  const saveNote = async (note) => {
    setSaving(true);
    try {
      await campaignController.updateCampaign(id, { note });
      toast.success('Note saved');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not save that note'));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  /** Same shape as saveNote, for a `type: 'message'` campaign's template. */
  const saveMessageTemplate = async (messageTemplate) => {
    setSaving(true);
    try {
      await campaignController.updateCampaign(id, { messageTemplate });
      toast.success('Message saved');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not save that message'));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return {
    data,
    campaign,
    members,
    pagination,
    statusFilter,
    setStatusFilter,
    loading,
    busy,
    saving,
    running,
    start,
    previewOpen,
    previewLoading,
    previewMembers,
    openStartPreview,
    closeStartPreview,
    confirmStart,
    senderName,
    pause,
    retryFailed,
    saveNote,
    saveMessageTemplate,
    goToPage: loadMembers,
  };
}
