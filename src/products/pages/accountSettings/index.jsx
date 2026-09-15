import { useState } from 'react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { PageTabs } from 'src/core/primitives/PageTabs';
import { ProfileTab } from './components/ProfileTab.jsx';
import { BillingTab } from './components/BillingTab.jsx';
import { ExtensionTab } from './components/ExtensionTab.jsx';
import { ServerSendingCard } from './components/ServerSendingCard.jsx';
import { AiContextTab } from './components/AiContextTab.jsx';
import { settingsStrings as t } from './strings.js';

const TABS = [
  { id: 'profile', label: t.tabs.profile },
  { id: 'billing', label: t.tabs.billing },
  { id: 'extension', label: t.tabs.extension },
  { id: 'ai', label: t.tabs.ai },
];

/**
 * Account settings.
 *
 * Deliberately narrow for now: the three things a user actually needs to see
 * about their own account. Sending limits, notifications and team management
 * are planned but are not stubbed out here — an empty tab reads as broken,
 * whereas a missing tab reads as "not built yet".
 */
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <DashboardLayout title={t.pageTitle} subtitle={t.pageSubtitle}>
      <PageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="p-[var(--ui-pad-lg)] max-w-[720px]">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'extension' && (
          <div className="flex flex-col gap-4">
            <ExtensionTab />
            <ServerSendingCard />
          </div>
        )}
        {activeTab === 'ai' && <AiContextTab />}
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
