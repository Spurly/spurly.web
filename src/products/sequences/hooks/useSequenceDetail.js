import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sequenceController from '../controller/sequence.js';
import { stepsError } from '../stepTypes.js';
import { POLL_MS, SEQUENCE_EVENTS } from '../constants/constants.js';

/**
 * One sequence: its steps, who is enrolled, and where each of them is.
 * Moved out of the page component unchanged — every effect, poll, and
 * error-toast path below is the same as when it lived there. `id` is read
 * internally via useParams(), same shape as useCampaignDetail.
 */
export function useSequenceDetail() {
  const { id } = useParams();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [data, setData] = useState(null);
  const [draftSteps, setDraftSteps] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();
  const mountedRef = useRef(true);

  // Set on every mount (not just cleared on unmount) — StrictMode's dev
  // double-mount otherwise leaves this false for the real mount's whole life
  // and every "am I still on screen?" guard fails. Same note as CampaignDetailPage.
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => {
    sequenceController.getSequence(eventEmitter, id);
  }, [eventEmitter, id]);

  const loadEnrollments = useCallback((page = 1) => {
    sequenceController.listEnrollments(eventEmitter, id, { status: statusFilter || undefined, page });
  }, [eventEmitter, id, statusFilter]);

  const start = useCallback(() => {
    setBusy(true);
    sequenceController.startSequence(eventEmitter, id);
  }, [eventEmitter, id]);

  const pause = useCallback(() => {
    setBusy(true);
    sequenceController.pauseSequence(eventEmitter, id);
  }, [eventEmitter, id]);

  const sequence = data?.sequence ?? null;
  const running = sequence?.status === 'running';

  const stepsDirty = sequence && draftSteps && JSON.stringify(draftSteps) !== JSON.stringify(sequence.steps);
  const stepsValidation = draftSteps ? stepsError(draftSteps) : null;

  const saveSteps = useCallback(() => {
    if (!stepsDirty || stepsValidation) return;
    setSaving(true);
    sequenceController.updateSequence(eventEmitter, id, { steps: draftSteps });
  }, [stepsDirty, stepsValidation, eventEmitter, id, draftSteps]);

  const remove = useCallback(() => {
    const total = data?.enrollmentCounts
      ? Object.values(data.enrollmentCounts).reduce((a, b) => a + b, 0)
      : 0;
    confirm({
      title: 'Remove this sequence?',
      body: total
        ? `Actions already taken for the ${total.toLocaleString()} lead(s) enrolled (visits, invitations, messages sent) are not undone — only the sequence and its enrollment records are removed.`
        : 'Nothing has been enrolled, so nothing is undone.',
      confirmLabel: 'Remove',
    }).then((ok) => {
      if (!ok) return;
      setBusy(true);
      sequenceController.deleteSequence(eventEmitter, id);
    });
  }, [confirm, data, eventEmitter, id]);

  useEffect(() => {
    function handleGetSuccess(next) {
      if (!mountedRef.current) return;
      setData(next);
      // Only reset local edit state from the server when not actively
      // editing a draft's steps — otherwise the 10s poll would overwrite
      // in-progress, unsaved changes with what the server last saved.
      setDraftSteps((prev) => (prev === null ? next?.sequence?.steps ?? [] : prev));
      setLoading(false);
    }
    function handleGetFailure(error) {
      if (!mountedRef.current) return;
      toast.error(getToastError(error, 'Could not load that sequence'));
      setLoading(false);
    }
    function handleListEnrollmentsSuccess(res) {
      if (!mountedRef.current) return;
      setEnrollments(res.enrollments ?? []);
      setPagination({ page: res.page ?? 1, limit: res.limit ?? 50, total: res.total ?? 0 });
    }
    function handleListEnrollmentsFailure(error) {
      if (!mountedRef.current) return;
      toast.error(getToastError(error, 'Could not load enrollments'));
    }
    function handleStartSuccess() {
      toast.success('Started. Steps run on their own schedule.');
      if (mountedRef.current) setBusy(false);
      load();
    }
    function handleStartFailure(error) {
      toast.error(getToastError(error, 'Could not start that sequence'));
      if (mountedRef.current) setBusy(false);
    }
    function handlePauseSuccess() {
      toast.success('Paused. Enrollment progress is kept.');
      if (mountedRef.current) setBusy(false);
      load();
    }
    function handlePauseFailure(error) {
      toast.error(getToastError(error, 'Could not pause that sequence'));
      if (mountedRef.current) setBusy(false);
    }
    function handleUpdateSuccess(updated) {
      toast.success('Steps saved');
      setData((prev) => ({ ...prev, sequence: updated }));
      setDraftSteps(updated?.steps ?? draftSteps);
      if (mountedRef.current) setSaving(false);
    }
    function handleUpdateFailure(error) {
      toast.error(getToastError(error, 'Could not save those steps'));
      if (mountedRef.current) setSaving(false);
    }
    function handleDeleteSuccess() {
      toast.success('Sequence removed');
      window.location.assign('/hub/sequences');
    }
    function handleDeleteFailure(error) {
      toast.error(getToastError(error, 'Could not remove that sequence'));
      if (mountedRef.current) setBusy(false);
    }

    eventEmitter.on(SEQUENCE_EVENTS.GET_SEQUENCE_SUCCESS, handleGetSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.GET_SEQUENCE_FAILURE, handleGetFailure);
    eventEmitter.on(SEQUENCE_EVENTS.LIST_ENROLLMENTS_SUCCESS, handleListEnrollmentsSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.LIST_ENROLLMENTS_FAILURE, handleListEnrollmentsFailure);
    eventEmitter.on(SEQUENCE_EVENTS.START_SEQUENCE_SUCCESS, handleStartSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.START_SEQUENCE_FAILURE, handleStartFailure);
    eventEmitter.on(SEQUENCE_EVENTS.PAUSE_SEQUENCE_SUCCESS, handlePauseSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.PAUSE_SEQUENCE_FAILURE, handlePauseFailure);
    eventEmitter.on(SEQUENCE_EVENTS.UPDATE_SEQUENCE_SUCCESS, handleUpdateSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.UPDATE_SEQUENCE_FAILURE, handleUpdateFailure);
    eventEmitter.on(SEQUENCE_EVENTS.DELETE_SEQUENCE_SUCCESS, handleDeleteSuccess);
    eventEmitter.on(SEQUENCE_EVENTS.DELETE_SEQUENCE_FAILURE, handleDeleteFailure);

    return () => {
      eventEmitter.off(SEQUENCE_EVENTS.GET_SEQUENCE_SUCCESS, handleGetSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.GET_SEQUENCE_FAILURE, handleGetFailure);
      eventEmitter.off(SEQUENCE_EVENTS.LIST_ENROLLMENTS_SUCCESS, handleListEnrollmentsSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.LIST_ENROLLMENTS_FAILURE, handleListEnrollmentsFailure);
      eventEmitter.off(SEQUENCE_EVENTS.START_SEQUENCE_SUCCESS, handleStartSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.START_SEQUENCE_FAILURE, handleStartFailure);
      eventEmitter.off(SEQUENCE_EVENTS.PAUSE_SEQUENCE_SUCCESS, handlePauseSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.PAUSE_SEQUENCE_FAILURE, handlePauseFailure);
      eventEmitter.off(SEQUENCE_EVENTS.UPDATE_SEQUENCE_SUCCESS, handleUpdateSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.UPDATE_SEQUENCE_FAILURE, handleUpdateFailure);
      eventEmitter.off(SEQUENCE_EVENTS.DELETE_SEQUENCE_SUCCESS, handleDeleteSuccess);
      eventEmitter.off(SEQUENCE_EVENTS.DELETE_SEQUENCE_FAILURE, handleDeleteFailure);
    };
  }, [eventEmitter, load, toast, draftSteps]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadEnrollments(1); }, [loadEnrollments]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { load(); loadEnrollments(pagination.page); }, POLL_MS);
    return () => clearInterval(t);
  }, [running, load, loadEnrollments, pagination.page]);

  return {
    data,
    sequence,
    draftSteps,
    setDraftSteps,
    enrollments,
    pagination,
    statusFilter,
    setStatusFilter,
    loading,
    busy,
    saving,
    running,
    start,
    pause,
    saveSteps,
    remove,
    stepsDirty,
    stepsValidation,
    loadEnrollments,
  };
}
