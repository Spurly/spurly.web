import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Badge, useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { hubSequencesApi } from './api.js';
import { SequenceStepBuilder } from './SequenceStepBuilder.jsx';
import { hubEnrollmentColumns } from './columns.jsx';
import { stepsError } from './stepTypes.js';

/**
 * One sequence: its steps, who is enrolled, and where each of them is.
 *
 * Steps are editable ONLY while the sequence is a draft — the backend 409s
 * (SEQUENCE_NOT_EDITABLE) otherwise, because an enrolled lead may be
 * mid-flight on a step that a rewrite would silently change out from under
 * them. Once running or paused, the step list renders read-only; pause a
 * running sequence and its status is still not 'draft', so the plan's
 * "pause to edit" story does not exist on the backend as built — this page
 * does not imply it does.
 */

const POLL_MS = 10000;

const STATUS_VIEW = {
  draft: { label: 'Draft', tone: 'neutral', detail: 'Nothing runs until you enroll leads and start it.' },
  running: { label: 'Running', tone: 'success', detail: 'Steps run on their own schedule.' },
  paused: { label: 'Paused', tone: 'warning', detail: 'Stopped. Enrollment progress is kept.' },
  done: { label: 'Finished', tone: 'info', detail: 'Everyone enrolled has been handled.' },
};

export function SequenceDetailPage() {
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

  const load = useCallback(() => hubSequencesApi.getSequence(id)
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

  const loadEnrollments = useCallback((page = 1) => hubSequencesApi
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

  const stepsDirty = sequence && draftSteps && JSON.stringify(draftSteps) !== JSON.stringify(sequence.steps);
  const stepsValidation = draftSteps ? stepsError(draftSteps) : null;

  const saveSteps = async () => {
    if (!stepsDirty || stepsValidation) return;
    setSaving(true);
    try {
      const updated = await hubSequencesApi.updateSequence(id, { steps: draftSteps });
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
      await hubSequencesApi.deleteSequence(id);
      toast.success('Sequence removed');
      window.location.assign('/hub/sequences');
    } catch (err) {
      toast.error(getToastError(err, 'Could not remove that sequence'));
      if (mountedRef.current) setBusy(false);
    }
  };

  if (loading && !sequence) {
    return (
      <DashboardLayout title="Sequence">
        <p className="text-[13px] text-[var(--text-tertiary)]">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!sequence) {
    return (
      <DashboardLayout title="Sequence">
        <p className="text-[13px] text-[var(--text-secondary)]">
          That sequence is not here. <Link to="/hub/sequences" className="underline">Back to sequences</Link>
        </p>
      </DashboardLayout>
    );
  }

  const view = STATUS_VIEW[sequence.status] ?? STATUS_VIEW.draft;
  const counts = data.enrollmentCounts ?? {};
  const totalEnrolled = Object.values(counts).reduce((a, b) => a + b, 0);
  const isDraft = sequence.status === 'draft';

  return (
    <DashboardLayout
      title={sequence.name}
      subtitle={`${sequence.steps.length} step(s) · ${totalEnrolled.toLocaleString()} enrolled`}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={view.tone} title={view.detail}>
            <span className="inline-flex items-center gap-1">
              {running && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
              {view.label}
            </span>
          </Badge>
          {running ? (
            <Button size="sm" variant="secondary" leadingIcon={<Pause size={13} />} disabled={busy}
              onClick={() => act(() => hubSequencesApi.pauseSequence(id), 'Paused. Enrollment progress is kept.', 'Could not pause that sequence')}>
              Pause
            </Button>
          ) : (
            <Button size="sm" leadingIcon={<Play size={13} />} disabled={busy || sequence.status === 'done'}
              onClick={() => act(
                () => hubSequencesApi.startSequence(id),
                'Started. Steps run on their own schedule.',
                'Could not start that sequence',
              )}>
              {sequence.status === 'paused' ? 'Resume' : 'Start'}
            </Button>
          )}
          <Button size="sm" variant="ghost" leadingIcon={<Trash2 size={13} />} disabled={busy} onClick={remove}>
            Remove
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Link to="/hub/sequences" className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> All sequences
        </Link>

        {sequence.error && (
          <div className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)]" style={{ background: 'var(--ui-warning-tint)' }}>
            <p className="text-[12px]" style={{ color: 'var(--ui-warning-fg)' }}>{sequence.error}</p>
          </div>
        )}

        {totalEnrolled === 0 && (
          <div className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 rounded-[var(--ui-radius-md)]" style={{ background: 'var(--ui-surface-sunken)' }}>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Nobody is enrolled yet. Select leads on the <Link to="/hub/leads" className="underline">leads page</Link> and enroll them in this sequence, then come back here to start it.
            </p>
          </div>
        )}

        <SectionCard title="Steps" noPadding>
          {isDraft && stepsDirty && (
            <div className="flex items-center justify-end px-[var(--ui-pad-lg)] py-2 border-b border-[var(--separator)]" style={{ background: 'var(--ui-surface-sunken)' }}>
              <Button size="sm" disabled={saving || !!stepsValidation} loading={saving} onClick={saveSteps}>
                Save steps
              </Button>
            </div>
          )}
          <SequenceStepBuilder
            steps={draftSteps ?? sequence.steps}
            onChange={setDraftSteps}
            readOnly={!isDraft}
          />
          {isDraft && stepsValidation && (
            <p className="px-[var(--ui-pad-lg)] pb-3 text-[11px] text-[var(--red)]">{stepsValidation}</p>
          )}
        </SectionCard>

        <DataTable
          columns={hubEnrollmentColumns(sequence.steps)}
          data={enrollments}
          loading={loading}
          emptyMessage={statusFilter ? 'Nobody in this state' : 'Nobody enrolled yet'}
          emptyHint={statusFilter ? 'Try another filter.' : 'Enroll leads from the leads page.'}
          toolbar={{
            filters: (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="text-[12px] rounded-[var(--ui-radius-sm)] border border-[var(--separator)] bg-[var(--ui-surface-card)] px-2 py-1 text-[var(--text-secondary)]"
              >
                <option value="">Everyone ({totalEnrolled})</option>
                <option value="active">Active ({counts.active ?? 0})</option>
                <option value="waiting">Waiting ({counts.waiting ?? 0})</option>
                <option value="completed">Completed ({counts.completed ?? 0})</option>
                <option value="stopped">Stopped ({counts.stopped ?? 0})</option>
                <option value="failed">Failed ({counts.failed ?? 0})</option>
              </select>
            ),
          }}
          pagination={{
            page: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: (page) => loadEnrollments(page),
          }}
        />
      </div>
    </DashboardLayout>
  );
}

export default SequenceDetailPage;
