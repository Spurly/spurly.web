import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Pause, Play, Trash2, Plus, Workflow } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Badge, EmptyState, useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { hubSequencesApi } from './api.js';

export { NewSequencePage as HubNewSequencePage } from './NewSequencePage.jsx';
export { SequenceDetailPage as HubSequenceDetailPage } from './SequenceDetailPage.jsx';

/**
 * Hub sequences — the list.
 *
 * Unlike campaigns (built from a lead selection, so the list page has no
 * "New" button), a sequence needs at least one configured step before the
 * backend will save it at all — there is nothing to select first, so this
 * page does carry a "New sequence" button, straight into the step builder.
 */

const POLL_MS = 10000;

const STATUS_VIEW = {
  draft: { label: 'Draft', tone: 'neutral', detail: 'Nothing runs until you enroll leads and start it.' },
  running: { label: 'Running', tone: 'success', detail: 'Steps run on their own schedule.' },
  paused: { label: 'Paused', tone: 'warning', detail: 'Stopped. Enrollment progress is kept.' },
  done: { label: 'Finished', tone: 'info', detail: 'Everyone enrolled has been handled.' },
};

const isLive = (s) => s?.status === 'running';

function SequenceRow({ sequence, onStart, onPause, onDelete, busy }) {
  const view = STATUS_VIEW[sequence.status] ?? STATUS_VIEW.draft;
  const running = isLive(sequence);

  return (
    <div className="flex items-center gap-3 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--separator)] last:border-b-0">
      <Link to={`/hub/sequences/${sequence._id}`} className="flex-1 min-w-0 group">
        <span className="block text-[13px] text-[var(--text-primary)] truncate group-hover:underline">
          {sequence.name}
        </span>
        <span className="block text-[11px] text-[var(--text-tertiary)] truncate">
          {sequence.steps?.length ?? 0} step(s)
          {sequence.pausedReason === 'account' && ' · LinkedIn needs reconnecting'}
          {sequence.pausedReason === 'breaker' && ' · stopped after repeated failures'}
          {sequence.pausedReason === 'entitlement' && ' · plan no longer includes Hub'}
        </span>
      </Link>

      <Badge tone={view.tone} title={view.detail}>
        <span className="inline-flex items-center gap-1">
          {running && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
          {view.label}
        </span>
      </Badge>

      <div className="flex items-center gap-1 shrink-0">
        {running ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onPause(sequence)} title="Stop this sequence">
            <Pause size={13} />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || sequence.status === 'done'}
            onClick={() => onStart(sequence)}
            title={sequence.status === 'paused' ? 'Resume' : 'Start'}
          >
            <Play size={13} />
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDelete(sequence)} title="Remove this sequence">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

export function HubSequencesPage() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => hubSequencesApi.listSequences()
    .then((next) => { if (mountedRef.current) setSequences(next); })
    .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load your sequences')); })
    .finally(() => { if (mountedRef.current) setLoading(false); }), [toast]);

  useEffect(() => { load(); }, [load]);

  const anyLive = sequences.some(isLive);
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const act = async (fn, sequence, okMessage, failMessage) => {
    setBusy(true);
    try {
      await fn(sequence._id);
      toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(getToastError(err, failMessage));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const start = (sequence) => act(
    (id) => hubSequencesApi.startSequence(id),
    sequence,
    'Started. Steps run on their own schedule.',
    'Could not start that sequence',
  );

  const pause = (sequence) => act(
    (id) => hubSequencesApi.pauseSequence(id),
    sequence,
    'Paused. Enrollment progress is kept.',
    'Could not pause that sequence',
  );

  const remove = async (sequence) => {
    const ok = await confirm({
      title: 'Remove this sequence?',
      body: 'Actions it already took for enrolled leads are not undone — only the sequence and its enrollment records are removed.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    act((id) => hubSequencesApi.deleteSequence(id), sequence, 'Sequence removed', 'Could not remove that sequence');
  };

  return (
    <DashboardLayout
      title="Sequences"
      subtitle="A linear list of steps, run against whoever you enroll."
      actions={<Button leadingIcon={<Plus size={13} />} onClick={() => navigate('/hub/sequences/new')}>New sequence</Button>}
    >
      {!loading && sequences.length === 0 ? (
        <EmptyState
          icon={<Workflow size={20} />}
          title="No sequences yet"
          hint="A sequence is a list of steps — visit, connect, message, wait — run against the leads you enroll."
          action={<Button onClick={() => navigate('/hub/sequences/new')}>New sequence</Button>}
        />
      ) : (
        <SectionCard title="Sequences" noPadding>
          {loading ? (
            <p className="px-[var(--ui-pad-lg)] py-6 text-[13px] text-[var(--text-tertiary)]">Loading…</p>
          ) : (
            sequences.map((sequence) => (
              <SequenceRow
                key={sequence._id}
                sequence={sequence}
                onStart={start}
                onPause={pause}
                onDelete={remove}
                busy={busy}
              />
            ))
          )}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}

export default HubSequencesPage;
