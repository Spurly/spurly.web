import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * Import page — fully automatic (2026-11-02).
 *
 * Upload a CSV and nothing else is asked of the user: rows with a LinkedIn
 * URL go straight to the Hub, rows with a name + company are found on
 * LinkedIn and EVERY confirmed match follows them. The page is a live
 * readout of that pipeline — Finding on LinkedIn → Sending to Hub → In
 * your Leads. A row leaves this page once its people reach the Hub; they
 * end up in Leads, under an audience named after the file,
 * where the user filters them and builds sequences.
 */

const LOOKUP_VIEWS = { finding: 'in_progress', notfound: 'not_found' };
const STAGING_VIEWS = { sending: 'queued', failed: 'failed' };

export function ImportPage() {
  const navigate = useNavigate();
  const store = useImportedLeads();
  const { refresh, setStatusFilter: setStagingFilter, stats: stagingStats } = store;

  const refreshStagedSilently = useCallback(() => refresh({ silent: true }), [refresh]);
  const lookups = useLinkedInLookups({ onStaged: refreshStagedSilently });
  const { refresh: refreshLookups, setStatusFilter: setLookupFilter, stats: lookupStats } = lookups;

  const [mode, setMode] = useState(null); // null (deciding) | 'pipeline' | 'upload'
  const [view, setViewState] = useState('finding');

  const counts = {
    finding: lookupStats.inFlight || 0,
    notFound: lookupStats.notFound || 0,
    sending: stagingStats.byStatus?.queued || 0,
    failed: stagingStats.byStatus?.failed || 0,
  };
  const hasAnything = counts.finding + counts.notFound + (stagingStats.total || 0) > 0;

  const setView = useCallback(
    (next) => {
      setViewState(next);
      if (LOOKUP_VIEWS[next]) setLookupFilter(LOOKUP_VIEWS[next]);
      if (STAGING_VIEWS[next]) setStagingFilter(STAGING_VIEWS[next]);
    },
    [setLookupFilter, setStagingFilter],
  );

  // First load: open on whatever is moving right now.
  const decided = useRef(false);
  const firstLoadDone = !store.loading && !lookups.loading;
  useEffect(() => {
    if (decided.current || !firstLoadDone) return undefined;
    decided.current = true;
    const start = counts.finding > 0 ? 'finding' : counts.sending > 0 ? 'sending' : counts.failed > 0 ? 'failed' : counts.notFound > 0 ? 'notfound' : 'finding';
    const timer = setTimeout(() => {
      setView(start);
      setMode(hasAnything ? 'pipeline' : 'upload');
    }, 0);
    return () => clearTimeout(timer);
  }, [firstLoadDone, counts.finding, counts.sending, counts.failed, counts.notFound, hasAnything, setView]);

  // Staged rows only move while something polls; keep both halves fresh
  // while anything is in flight (rows land in Hub Leads on their own).
  const sendingNow = counts.sending > 0;
  useEffect(() => {
    if (!sendingNow) return undefined;
    const interval = setInterval(() => refreshLookups({ silent: true }), 8000);
    return () => clearInterval(interval);
  }, [sendingNow, refreshLookups]);

  const handleImported = useCallback(
    (res) => {
      refresh({ silent: true });
      refreshLookups({ silent: true });
      setView(res?.finding ? 'finding' : 'sending');
      setMode('pipeline');
    },
    [refresh, refreshLookups, setView],
  );

  const isLookupView = Boolean(LOOKUP_VIEWS[view]);

  if (mode === 'upload') {
    return (
      <DashboardLayout title={t.pageTitle} layout="fill">
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
        <PipelineBar counts={counts} view={view} onSelect={setView} onOpenLeads={() => navigate('/hub/leads')} />
        <div className="flex-1 min-h-[420px] flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)] overflow-hidden">
          {isLookupView ? (
            <LookupPanel store={lookups} controlled />
          ) : (
            <StagingPanel store={store} controlled onGoToUpload={() => setMode('upload')} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
