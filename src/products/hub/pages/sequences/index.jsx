import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Pause, Play, Trash2, Plus, Workflow } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Badge, EmptyState } from 'src/ui/primitives';
import { useSequencesPage, isLive } from 'src/products/hub/sequences/hooks/useSequencesPage.js';
import { SEQUENCE_STATUS_VIEW as STATUS_VIEW } from './components/statusView.js';
import { sequencesStrings } from './strings.js';

export { NewSequencePage as HubNewSequencePage } from './NewSequencePage.jsx';
export { SequenceDetailPage as HubSequenceDetailPage } from './SequenceDetailPage.jsx';

const t = sequencesStrings.list;

/**
 * Hub sequences — the list.
 *
 * Unlike campaigns (built from a lead selection, so the list page has no
 * "New" button), a sequence needs at least one configured step before the
 * backend will save it at all — there is nothing to select first, so this
 * page does carry a "New sequence" button, straight into the step builder.
 */
function SequenceRow({ sequence, onStart, onPause, onDelete, busy }) {
  const view = STATUS_VIEW[sequence.status] ?? STATUS_VIEW.draft;
  const running = isLive(sequence);

  return (
    <div className="flex items-center gap-3 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0">
      <Link to={`/hub/sequences/${sequence._id}`} className="flex-1 min-w-0 group">
        <span className="block text-[var(--ui-t-body)] text-[var(--ui-text-primary)] truncate group-hover:underline">
          {sequence.name}
        </span>
        <span className="block text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] truncate">
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
  const { sequences, loading, busy, start, pause, remove } = useSequencesPage();
  const navigate = useNavigate();

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={<Button leadingIcon={<Plus size={13} />} onClick={() => navigate('/hub/sequences/new')}>{t.newSequence}</Button>}
    >
      {!loading && sequences.length === 0 ? (
        <EmptyState
          icon={<Workflow size={20} />}
          title={t.emptyTitle}
          hint={t.emptyHint}
          action={<Button onClick={() => navigate('/hub/sequences/new')}>{t.newSequence}</Button>}
        />
      ) : (
        <SectionCard title={t.sectionTitle} noPadding>
          {loading ? (
            <p className="px-[var(--ui-pad-lg)] py-6 text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{t.loading}</p>
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
