import { useSearchParams } from 'react-router-dom';
import { SettingsFrame, SETTINGS_TABS } from './components/SettingsFrame.jsx';
import { ProfileTab } from './components/ProfileTab.jsx';
import { BillingTab } from './components/BillingTab.jsx';
import { ExtensionTab } from './components/ExtensionTab.jsx';
import { ServerSendingCard } from './components/ServerSendingCard.jsx';
import { AiContextTab } from './components/AiContextTab.jsx';
import { SendingLimitsTab } from './components/SendingLimitsTab.jsx';
import { TeamTab } from './components/TeamTab.jsx';

export { SettingsFrame } from './components/SettingsFrame.jsx';

/**
 * Settings — every tab except LinkedIn (which has its own route and renders
 * the same frame, see pages/settings). The tab lives in `?tab=` so it
 * survives a refresh and can be linked to.
 */
export function SettingsPage() {
  const [params] = useSearchParams();
  const requested = params.get('tab');
  const activeTab = SETTINGS_TABS.some((x) => x.id === requested) && requested !== 'linkedin' ? requested : 'account';

  return (
    <SettingsFrame activeTab={activeTab}>
      {activeTab === 'account' && <ProfileTab />}
      {activeTab === 'limits' && <SendingLimitsTab />}
      {activeTab === 'ai' && <AiContextTab />}
      {activeTab === 'extension' && (
        <>
          <ExtensionTab />
          <ServerSendingCard />
        </>
      )}
      {activeTab === 'team' && <TeamTab />}
      {activeTab === 'billing' && <BillingTab />}
    </SettingsFrame>
  );
}

export default SettingsPage;
