import { useState, useCallback } from 'react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { PageTabs } from 'src/core/primitives/PageTabs';
import { useImportedLeads } from 'src/products/import/hooks/useImportedLeads.js';
import { UploadPanel } from './components/UploadPanel.jsx';
import { StagingPanel } from './components/StagingPanel.jsx';
import { importStrings as t } from './strings.js';

/**
 * Import page.
 *
 * Named for what the user comes here to do. It was briefly called "Enrich" on
 * the argument that enrichment is the step that matters — but enriching is one
 * ACTION taken on rows that are already here (alongside promoting and
 * deleting), while importing is the reason to open the page at all. The old
 * /dashboard/enrich URL still redirects here.
 *
 * Two steps, two tabs. A CSV lands in STAGING (free), gets enriched by the
 * extension visiting each profile, and only then moves into the Hub's own
 * lead dataset — where the capture charge and daily limit apply (see
 * HUB_CAPTURE_RESTRUCTURE_PLAN.md §6; this used to move into the flat People
 * list instead). Staging is a real collection, not a preview, so a
 * half-enriched import survives a page reload or a closed tab.
 */
export function ImportPage() {
  const [activeTab, setActiveTab] = useState('staged');
  const store = useImportedLeads();

  // After an upload finishes, refresh the staging list so the counts are right
  // whether or not the user switches tabs immediately.
  const { refresh } = store;
  const handleStaged = useCallback(
    (_result, opts = {}) => {
      refresh();
      if (opts.view) setActiveTab('staged');
    },
    [refresh],
  );

  const tabs = [
    { id: 'staged', label: t.tabs.staged, count: store.stats.total },
    { id: 'upload', label: t.tabs.upload },
  ];

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="page"
      tabs={<PageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />}
    >
      <div className="flex flex-col gap-4 w-full max-w-[1400px]">
        {activeTab === 'upload' ? (
          <div className="max-w-[1100px] flex flex-col gap-4">
            <UploadPanel onStaged={handleStaged} />
          </div>
        ) : (
          <StagingPanel store={store} onGoToUpload={() => setActiveTab('upload')} />
        )}
      </div>
    </DashboardLayout>
  );
}
