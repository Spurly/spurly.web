import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import sequenceController from '../controller/sequence.js';
import { stepsError } from '../stepTypes.js';
import { POLL_MS } from '../constants.js';

/**
 * One sequence: its steps, who is enrolled, and where each of them is.
 * Moved out of the page component unchanged — every effect, poll, and
 * error-toast path below is the same as when it lived there. `id` is read
 * internally via useParams(), same shape as useCampaignDetail.
 */
export function useSequenceDetail() {
  const { id } = useParams();
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

  const load = useCallback(() => sequenceController.getSequence(id)
    .then((next) => {
      if (!mountedRef.current) return;
      setData(next);
      // Only reset local edit state from the server when not actively
      // editing a draft's steps — otherwise the 10s poll would overwrite
      // in-progress, unsaved changes with what the server last saved.
      setDraftSteps((prev) => (prev === null ? next?.sequence?.steps ?? [] : prev));
    })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load that sequence')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [id, toast]);

  const loadEnrollments = useCallback((page = 1) => sequenceController
    .listEnrollments(id, { status: statusFilter || undefined, page })
    .then((res) => {
      if (!mountedRef.current) return;
      setEnrollments(res.enrollments ?? []);
      setPagination({ page: res.page ?? page, limit: res.limit ?? 50, total: res.total ?? 0 });
    })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load enrollments')); }), [id, statusFilter, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadEnrollments(1); }, [loadEnrollments]);

  const sequence = data?.sequence ?? null;
  const running = sequence?.status === 'running';

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { load(); loadEnrollments(pagination.page); }, POLL_MS);
    return () => clearInterval(t);
  }, [running, load, loadEnrollments, pagination.page]);

  const act = async (fn, okMessage, failMessage) => {
    setBusy(true);
    try {
      const result = await fn();
      toast.success(typeof okMessage === 'function' ? okMessage(result) : okMessage);
      await load();
    } catch (err) {
      toast.error(getToastError(err, failMessage));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const start = () => act(
    () => sequenceController.startSequence(id),
    'Started. Steps run on their own schedule.',
    'Could not start that sequence',
  );

  const pause = () => act(
    () => sequenceController.pauseSequence(id),
    'Paused. Enrollment progress is kept.',
    'Could not pause that sequence',
  );

  const stepsDirty = sequence && draftSteps && JSON.stringify(draftSteps) !== JSON.stringify(sequence.steps);
  const stepsValidation = draftSteps ? stepsError(draftSteps) : null;

  const saveSteps = async () => {
    if (!stepsDirty || stepsValidation) return;
    setSaving(true);
    try {
      const updated = await sequenceController.updateSequence(id, { steps: draftSteps });
      toast.success('Steps saved');
      setData((prev) => ({ ...prev, sequence: updated }));
      setDraftSteps(updated?.steps ?? draftSteps);
    } catch (err) {
      toast.error(getToastError(err, 'Could not save those steps'));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const remove = async () => {
    const total = data?.enrollmentCounts
      ? Object.values(data.enrollmentCounts).reduce((a, b) => a + b, 0)
      : 0;
    const ok = await confirm({
      title: 'Remove this sequence?',
      body: total
        ? `Actions already taken for the ${total.toLocaleString()} lead(s) enrolled (visits, invitations, messages sent) are not undone — only the sequence and its enrollment records are removed.`
        : 'Nothing has been enrolled, so nothing is undone.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await sequenceController.deleteSequence(id);
      toast.success('Sequence removed');
      window.location.assign('/hub/sequences');
    } catch (err) {
      toast.error(getToastError(err, 'Could not remove that sequence'));
      if (mountedRef.current) setBusy(false);
    }
  };

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
