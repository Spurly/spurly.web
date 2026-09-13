import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Skeleton } from 'src/ui/primitives';
import { useLinkedInSettings } from 'src/products/hub/settings/hooks/useLinkedInSettings.js';
import { ConnectionCard } from './components/ConnectionCard.jsx';
import { FreeAccountNotice } from './components/FreeAccountNotice.jsx';
import { linkedInSettingsStrings as t } from './strings.js';

/**
 * LinkedIn connection settings.
 *
 * A separate page rather than a tab on Settings, for two reasons: this belongs
 * to hub and the settings page belongs to leadgen (products never import each
 * other), and the server's hosted-auth flow already redirects back here.
 *
 * The state that matters is not "connected / not connected" — it is closer to
 * five, and each one needs different words and a different action. Getting that
 * wrong is how a user ends up staring at "Connected" while nothing sends.
 */
export function LinkedInSettingsPage() {
  const { account, loading, busy, handleConnect, handleRefresh, handleDisconnect } = useLinkedInSettings();

  return (
    <DashboardLayout title={t.pageTitle} subtitle={t.pageSubtitle}>
      <div className="p-[var(--ui-pad-lg)] max-w-[720px] flex flex-col gap-4">
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
      </div>
    </DashboardLayout>
  );
}

export default LinkedInSettingsPage;
