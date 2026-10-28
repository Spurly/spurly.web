import { useAuth } from 'src/core/auth/hooks/useAuth';
import { SettingsFrame } from '../accountSettings/components/SettingsFrame.jsx';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Skeleton } from 'src/core/primitives';
import { useLinkedInSettings } from 'src/products/settings/hooks/useLinkedInSettings.js';
import { useAccountHealth } from 'src/products/settings/hooks/useAccountHealth.js';
import { ConnectionCard } from './components/ConnectionCard.jsx';
import { AccountHealthCard } from './components/AccountHealthCard.jsx';
import { FreeAccountNotice } from './components/FreeAccountNotice.jsx';
import { LinkedInConnectDialog } from 'src/products/settings/components/LinkedInConnectDialog.jsx';
import { linkedInSettingsStrings as t } from './strings.js';

/**
 * LinkedIn connection settings.
 *
 * Connecting opens our own sign-in dialog (LinkedInConnectDialog); the
 * server's hosted-auth flow is the fallback and still redirects back here, and keeping it separate from the general
 * account Settings page keeps that page focused on account-wide fields.
 *
 * The state that matters is not "connected / not connected" — it is closer to
 * five, and each one needs different words and a different action. Getting that
 * wrong is how a user ends up staring at "Connected" while nothing sends.
 */
export function LinkedInSettingsPage() {
  const {
    account,
    loading,
    busy,
    connect,
    handleConnect,
    handleUseHosted,
    handleRefresh,
    handleDisconnect,
  } = useLinkedInSettings();
  const { user } = useAuth();
  const managed = Boolean(user?.isManaged);
  // A managed account whose person has a direct login may reconnect the LinkedIn
  // profile it already had (never a first connect, never a different profile).
  const reconnectOnly = managed && Boolean(user?.hasDirectLogin) && Boolean(account?.publicIdentifier || account?.linkedinName);
  // Only once something is linked and alive; a dead row reads as not connected.
  const health = useAccountHealth(Boolean(account?.connected));

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
              readOnly={managed && !reconnectOnly}
              reconnectOnly={reconnectOnly}
              onConnect={handleConnect}
              onRefresh={handleRefresh}
              onDisconnect={handleDisconnect}
            />
            {account?.connected && (
              <AccountHealthCard
                health={health.health}
                loading={health.loading}
                refreshing={health.refreshing}
                gaveUp={health.gaveUp}
                onRefresh={health.handleRefresh}
              />
            )}
            {account?.connected && !account?.isPremium && <FreeAccountNotice />}
          </>
        )}
        {!managed && <LinkedInConnectDialog connect={connect} onUseHosted={handleUseHosted} hostedBusy={busy} />}
    </SettingsFrame>
  );
}

export default LinkedInSettingsPage;
