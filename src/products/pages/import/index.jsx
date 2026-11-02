import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button } from 'src/core/primitives';
import { useImportedLeads } from 'src/products/import/hooks/useImportedLeads.js';
import { useLinkedInLookups } from 'src/products/import/hooks/useLinkedInLookups.js';
import { UploadPanel } from './components/UploadPanel.jsx';
import { StagingPanel } from './components/StagingPanel.jsx';
import { LookupPanel } from './components/LookupPanel.jsx';
import { PipelineBar } from './components/PipelineBar.jsx';
import { importStrings as t } from './strings.js';

/**
 * Import page — one pipeline instead of three tabs.
 *
 * People come here to get a list into Spurly; they don't think in
 * "staging" vs "lookups". So the page is the journey a row takes, left to
 * right — Finding on LinkedIn → Needs your review → Ready to send → Sending
 * to Hub — with a live count per stage (PipelineBar). The selected stage is
 * the table below. Stages waiting on the user carry their own action.
 *
 * Uploading is a wizard that takes over the page (UploadPanel), opened from
 * the header button. A first visit with nothing imported opens straight into
 * it — an empty table is a dead end, a drop zone is a next step.
 */

const LOOKUP_VIEWS = { finding: 'in_progress', notfound: 'not_found', review: 'needs_review' };
const STAGING_VIEWS = { ready: 'pending', sending: 'queued', failed: 'failed' };

export function ImportPage() {
  const store = useImportedLeads();
  const { refresh, setStatusFilter: setStagingFilter, stats: stagingStats } = store;

  const refreshStagedSilently = useCallback(() => refresh({ silent: true }), [refresh]);
  const lookups = useLinkedInLookups({ onStaged: refreshStagedSilently });
  const { refresh: refreshLookups, setStatusFilter: setLookupFilter, stats: lookupStats } = lookups;

  const [mode, setMode] = useState(null); // null (deciding) | 'pipeline' | 'upload'
  const [view, setViewState] = useState('ready');
  const [reviewSignal, setReviewSignal] = useState(0);
  const [sendSignal, setSendSignal] = useState(0);

  const counts = {
    finding: lookupStats.inFlight || 0,
    notFound: lookupStats.notFound || 0,
    review: lookupStats.needsReview || 0,
    ready: (stagingStats.byStatus?.pending || 0) + (stagingStats.byStatus?.enriched || 0),
    failed: stagingStats.byStatus?.failed || 0,
    sending: stagingStats.byStatus?.queued || 0,
  };
  const hasAnything =
    (stagingStats.total || 0) + counts.finding + counts.review + counts.notFound + (lookupStats.found || 0) > 0;

  const setView = useCallback(
    (next) => {
      setViewState(next);
      if (LOOKUP_VIEWS[next]) setLookupFilter(LOOKUP_VIEWS[next]);
      if (STAGING_VIEWS[next]) setStagingFilter(STAGING_VIEWS[next]);
    },
    [setLookupFilter, setStagingFilter],
  );

  // First load: decide where to start — on whatever is waiting for the user.
  const decided = useRef(false);
  const firstLoadDone = !store.loading && !lookups.loading;
  useEffect(() => {
    if (decided.current || !firstLoadDone) return undefined;
    decided.current = true;
    const start =
      counts.review > 0 ? 'review'
        : counts.finding > 0 ? 'finding'
          : counts.ready > 0 ? 'ready'
            : counts.sending > 0 ? 'sending'
              : counts.failed > 0 ? 'failed'
                : 'ready';
    const timer = setTimeout(() => {
      setView(start);
      setMode(hasAnything ? 'pipeline' : 'upload');
    }, 0);
    return () => clearTimeout(timer);
  }, [firstLoadDone, counts.review, counts.finding, counts.ready, counts.sending, counts.failed, hasAnything, setView]);

  const handleImported = useCallback(
    (res) => {
      refresh({ silent: true });
      refreshLookups({ silent: true });
      setView(res?.lookupQueued ? 'finding' : 'ready');
      setMode('pipeline');
    },
    [refresh, refreshLookups, setView],
  );

  const isLookupView = Boolean(LOOKUP_VIEWS[view]);

  if (mode === 'upload') {
    return (
      <DashboardLayout title={t.pageTitle} layout="page">
        <UploadPanel onDone={handleImported} onCancel={hasAnything ? () => setMode('pipeline') : null} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={t.pageTitle}
      layout="fill"
      actions={
        <Button variant="primary" leadingIcon={<UploadCloud size={15} />} onClick={() => setMode('upload')}>
          {t.uploadCta}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <PipelineBar
          counts={counts}
          view={view}
          onSelect={setView}
          onReview={() => {
            setView('review');
            setReviewSignal((n) => n + 1);
          }}
          onSend={() => {
            setView('ready');
            setSendSignal((n) => n + 1);
          }}
        />
        <div className="flex-1 min-h-[420px] flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)] overflow-hidden">
          {isLookupView ? (
            <LookupPanel store={lookups} controlled reviewSignal={reviewSignal} />
          ) : (
            <StagingPanel store={store} controlled sendSignal={sendSignal} onGoToUpload={() => setMode('upload')} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
