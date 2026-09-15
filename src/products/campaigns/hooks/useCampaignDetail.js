import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { useAuth } from 'src/core/auth/hooks/useAuth.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import campaignController from '../controller/campaign.js';
import { POLL_MS, CAMPAIGN_EVENTS } from '../constants/constants.js';

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
  const eventEmitter = useMemo(() => new EventEmitter(), []);

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
  // Which field saveNote/saveMessageTemplate last wrote — updateCampaign
  // shares one event pair for both, so the UPDATE_CAMPAIGN_SUCCESS handler
  // reads this to know which toast copy to show.
  const pendingSaveKindRef = useRef(null);
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

  const load = useCallback(() => {
    campaignController.getCampaign(eventEmitter, id);
  }, [eventEmitter, id]);

  const loadMembers = useCallback((page = 1) => {
    campaignController.listMembers(eventEmitter, id, { status: statusFilter || undefined, page });
  }, [eventEmitter, id, statusFilter]);

  const campaign = data?.campaign ?? null;
  const running = campaign?.status === 'running';

  const start = useCallback(() => {
    setBusy(true);
    campaignController.startCampaign(eventEmitter, id);
  }, [eventEmitter, id]);

  /**
   * Opens the review dialog and fetches a fresh, small sample of real
   * pending members to preview against. Fetched fresh rather than reusing
   * the page's own `members` (which may be filtered to "Failed" or another
   * status, or just stale) — the whole point of this dialog is to show who
   * is genuinely about to be messaged.
   *
   * Uses its own one-shot EventEmitter rather than the page's shared one:
   * this is a fire-and-forget preview load with no cross-call coordination
   * need, and reusing the shared emitter would collide with the page's own
   * LIST_MEMBERS handling.
   */
  const openStartPreview = useCallback(() => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    const previewEmitter = new EventEmitter();
    previewEmitter.once(CAMPAIGN_EVENTS.LIST_MEMBERS_SUCCESS, (res) => {
      if (!mountedRef.current) return;
      setPreviewMembers(res.members ?? []);
      setPreviewLoading(false);
    });
    previewEmitter.once(CAMPAIGN_EVENTS.LIST_MEMBERS_FAILURE, (error) => {
      if (!mountedRef.current) return;
      setPreviewMembers([]);
      toast.error(getToastError(error, 'Could not load a preview'));
      setPreviewLoading(false);
    });
    campaignController.listMembers(previewEmitter, id, { status: 'pending', page: 1, limit: 20 });
  }, [id, toast]);

  const closeStartPreview = useCallback(() => {
    if (busy) return; // let the in-flight start finish before this can be dismissed
    setPreviewOpen(false);
  }, [busy]);

  const confirmStart = useCallback(() => {
    start();
    setPreviewOpen(false);
  }, [start]);

  const pause = useCallback(() => {
    setBusy(true);
    campaignController.pauseCampaign(eventEmitter, id);
  }, [eventEmitter, id]);

  const retryFailed = useCallback(() => {
    setBusy(true);
    campaignController.retryFailed(eventEmitter, id);
  }, [eventEmitter, id]);

  const saveNote = useCallback((note) => {
    setSaving(true);
    pendingSaveKindRef.current = 'note';
    campaignController.updateCampaign(eventEmitter, id, { note });
  }, [eventEmitter, id]);

  /** Same shape as saveNote, for a `type: 'message'` campaign's template. */
  const saveMessageTemplate = useCallback((messageTemplate) => {
    setSaving(true);
    pendingSaveKindRef.current = 'message';
    campaignController.updateCampaign(eventEmitter, id, { messageTemplate });
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
    function handleListMembersSuccess(res) {
      if (!mountedRef.current) return;
      setMembers(res.members ?? []);
      setPagination(res.pagination ?? { page: 1, limit: 50, total: 0 });
    }
    function handleListMembersFailure(error) {
      if (!mountedRef.current) return;
      toast.error(getToastError(error, 'Could not load members'));
    }
    function handleStartSuccess() {
      toast.success('Started. Sending is paced through your working hours.');
      if (mountedRef.current) setBusy(false);
      load();
      loadMembers(pagination.page);
    }
    function handleStartFailure(error) {
      toast.error(getToastError(error, 'Could not start that campaign'));
      if (mountedRef.current) setBusy(false);
    }
    function handlePauseSuccess() {
      toast.success('Paused. Nobody else will be contacted.');
      if (mountedRef.current) setBusy(false);
      load();
      loadMembers(pagination.page);
    }
    function handlePauseFailure(error) {
      toast.error(getToastError(error, 'Could not pause that campaign'));
      if (mountedRef.current) setBusy(false);
    }
    function handleRetrySuccess(result) {
      toast.success(result.leftAlone
        ? `${result.requeued} queued again. ${result.leftAlone} left alone — those may already have been sent.`
        : `${result.requeued} queued again`);
      if (mountedRef.current) setBusy(false);
      load();
      loadMembers(pagination.page);
    }
    function handleRetryFailure(error) {
      toast.error(getToastError(error, 'Could not queue those again'));
      if (mountedRef.current) setBusy(false);
    }
    function handleUpdateSuccess() {
      toast.success(pendingSaveKindRef.current === 'message' ? 'Message saved' : 'Note saved');
      pendingSaveKindRef.current = null;
      if (mountedRef.current) setSaving(false);
      load();
    }
    function handleUpdateFailure(error) {
      const failMessage = pendingSaveKindRef.current === 'message'
        ? 'Could not save that message'
        : 'Could not save that note';
      pendingSaveKindRef.current = null;
      toast.error(getToastError(error, failMessage));
      if (mountedRef.current) setSaving(false);
    }

    eventEmitter.on(CAMPAIGN_EVENTS.GET_CAMPAIGN_SUCCESS, handleGetSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.GET_CAMPAIGN_FAILURE, handleGetFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.LIST_MEMBERS_SUCCESS, handleListMembersSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.LIST_MEMBERS_FAILURE, handleListMembersFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.START_CAMPAIGN_SUCCESS, handleStartSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.START_CAMPAIGN_FAILURE, handleStartFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_SUCCESS, handlePauseSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_FAILURE, handlePauseFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.RETRY_FAILED_SUCCESS, handleRetrySuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.RETRY_FAILED_FAILURE, handleRetryFailure);
    eventEmitter.on(CAMPAIGN_EVENTS.UPDATE_CAMPAIGN_SUCCESS, handleUpdateSuccess);
    eventEmitter.on(CAMPAIGN_EVENTS.UPDATE_CAMPAIGN_FAILURE, handleUpdateFailure);

    return () => {
      eventEmitter.off(CAMPAIGN_EVENTS.GET_CAMPAIGN_SUCCESS, handleGetSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.GET_CAMPAIGN_FAILURE, handleGetFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.LIST_MEMBERS_SUCCESS, handleListMembersSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.LIST_MEMBERS_FAILURE, handleListMembersFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.START_CAMPAIGN_SUCCESS, handleStartSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.START_CAMPAIGN_FAILURE, handleStartFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_SUCCESS, handlePauseSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_FAILURE, handlePauseFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.RETRY_FAILED_SUCCESS, handleRetrySuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.RETRY_FAILED_FAILURE, handleRetryFailure);
      eventEmitter.off(CAMPAIGN_EVENTS.UPDATE_CAMPAIGN_SUCCESS, handleUpdateSuccess);
      eventEmitter.off(CAMPAIGN_EVENTS.UPDATE_CAMPAIGN_FAILURE, handleUpdateFailure);
    };
  }, [eventEmitter, load, loadMembers, toast, pagination.page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMembers(1); }, [loadMembers]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { load(); loadMembers(pagination.page); }, POLL_MS);
    return () => clearInterval(t);
  }, [running, load, loadMembers, pagination.page]);

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
