import { SettingsFrame } from '../accountSettings/components/SettingsFrame.jsx';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Skeleton } from 'src/core/primitives';
import { useLinkedInSettings } from 'src/products/settings/hooks/useLinkedInSettings.js';
import { ConnectionCard } from './components/ConnectionCard.jsx';
import { FreeAccountNotice } from './components/FreeAccountNotice.jsx';
import { linkedInSettingsStrings as t } from './strings.js';

/**
 * LinkedIn connection settings.
 *
 * A separate page rather than a tab on Settings: the server's hosted-auth
 * flow already redirects back here, and keeping it separate from the general
 * account Settings page keeps that page focused on account-wide fields.
 *
 * The state that matters is not "connected / not connected" — it is closer to
 * five, and each one needs different words and a different action. Getting that
 * wrong is how a user ends up staring at "Connected" while nothing sends.
 */
export function LinkedInSettingsPage() {
  const { account, loading, busy, handleConnect, handleRefresh, handleDisconnect } = useLinkedInSettings();

  return (
    <SettingsFrame activeTab="linkedin">
        {loading ? (
          <SectionCard title={t.sectionTitle}>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </SectionCard>
        ) : (
          <>
            <ConnectionCard
              account={account}
              busy={busy}
              onConnect={handleConnect}
              onRefresh={handleRefresh}
              onDisconnect={handleDisconnect}
            />
            {account?.connected && !account?.isPremium && <FreeAccountNotice />}
          </>
        )}
    </SettingsFrame>
  );
}

export default LinkedInSettingsPage;
