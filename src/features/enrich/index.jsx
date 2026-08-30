import { useState, useCallback } from 'react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { Tabs } from 'src/common/components/Tabs';
import { useImportedLeads } from 'src/hooks/useImportedLeads';
import { UploadPanel } from './UploadPanel.jsx';
import { StagingPanel } from './StagingPanel.jsx';

/**
 * Enrich page.
 *
 * Named for the step that matters: importing a CSV is just how leads get here,
 * enrichment is what the page is for.
 *
 * Two steps, two tabs. A CSV lands in STAGING (free), gets enriched by the
 * extension visiting each profile, and only then moves into People — where the
 * capture charge and daily limit apply. Staging is a real collection, not a
 * preview, so a half-enriched import survives a page reload or a closed tab.
 */
export function EnrichPage() {
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
    { id: 'staged', label: 'Staged leads', count: store.stats.total },
    { id: 'upload', label: 'Import CSV' },
  ];

  return (
    <DashboardLayout
      title="Enrich"
      subtitle="Import a CSV, enrich the leads, then move them into Contacts."
    >
      <div className="flex flex-col h-full overflow-hidden">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-[var(--ui-pad-lg)] flex flex-col gap-6 w-full max-w-[1400px]">
            {activeTab === 'upload' ? (
              <div className="max-w-[1100px] flex flex-col gap-6">
                <UploadPanel onStaged={handleStaged} />
              </div>
            ) : (
              <StagingPanel store={store} onGoToUpload={() => setActiveTab('upload')} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
