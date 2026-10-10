import { useState } from 'react';
import { SettingsFrame } from '../accountSettings/components/SettingsFrame.jsx';
import { Button, SectionCard, useConfirm, useErrorToast, useToast } from 'src/core/primitives';
import { useTokens } from 'src/products/aiAssistants/hooks/useTokens.js';
import { useConnectedApps } from 'src/products/aiAssistants/hooks/useConnectedApps.js';
import { useActionSwitch } from 'src/products/aiAssistants/hooks/useActionSwitch.js';
import { useActivity } from 'src/products/aiAssistants/hooks/useActivity.js';
import { TokenList } from 'src/products/aiAssistants/components/TokenList.jsx';
import { CreateTokenDialog } from 'src/products/aiAssistants/components/CreateTokenDialog.jsx';
import { TokenSecret } from 'src/products/aiAssistants/components/TokenSecret.jsx';
import { ConnectedApps } from 'src/products/aiAssistants/components/ConnectedApps.jsx';
import { ActionSwitch } from 'src/products/aiAssistants/components/ActionSwitch.jsx';
import { ConnectGuide } from 'src/products/aiAssistants/components/ConnectGuide.jsx';
import { ActivityList } from 'src/products/aiAssistants/components/ActivityList.jsx';

/**
 * Settings → AI assistants. Everything about letting Claude and other assistants use Spurly:
 * how to connect, the apps already connected, personal tokens, the action switch, and recent
 * activity. Sits behind SubscribeGate, so a lapsed trial never reaches it.
 */
export function AiAssistantsPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const tokens = useTokens();
  const apps = useConnectedApps();
  const actionSwitch = useActionSwitch();
  const activity = useActivity();
  const [creating, setCreating] = useState(false);

  useErrorToast(tokens.error, 'Could not load your tokens');
  useErrorToast(apps.error, 'Could not load connected apps');
  useErrorToast(actionSwitch.error, 'Could not update the setting');

  function handleCreate(payload) {
    tokens.emitter.once('AI_TOKEN_CREATE_SUCCESS', () => setCreating(false));
    tokens.create(payload);
  }

  function handleRevoke(token) {
    confirm({
      title: `Revoke “${token.name}”?`,
      description: 'Anything using this token stops working straight away.',
      confirmLabel: 'Revoke',
    }).then((ok) => {
      if (!ok) return;
      tokens.emitter.once('AI_TOKEN_REVOKE_SUCCESS', () => toast.success('Token revoked'));
      tokens.revoke(token.id);
    });
  }

  function handleDisconnect(app) {
    confirm({
      title: `Disconnect ${app.name}?`,
      description: 'It will need your approval again to reconnect.',
      confirmLabel: 'Disconnect',
    }).then((ok) => {
      if (!ok) return;
      apps.emitter.once('AI_APP_DISCONNECT_SUCCESS', () => toast.success('Disconnected'));
      apps.disconnect(app.id);
    });
  }

  return (
    <SettingsFrame activeTab="assistants">
      <SectionCard title="Connect an assistant">
        <ConnectGuide />
      </SectionCard>
      <SectionCard title="Connected apps">
        <ConnectedApps apps={apps.apps} loading={apps.loading} onDisconnect={handleDisconnect} />
      </SectionCard>
      <SectionCard title="Actions">
        <ActionSwitch enabled={actionSwitch.enabled} loading={actionSwitch.loading} saving={actionSwitch.saving} onChange={actionSwitch.change} />
      </SectionCard>
      <SectionCard title="Personal tokens" action={<Button size="sm" variant="secondary" onClick={() => setCreating(true)}>Create token</Button>}>
        <TokenList tokens={tokens.tokens} loading={tokens.loading} onRevoke={handleRevoke} onCreate={() => setCreating(true)} />
      </SectionCard>
      <SectionCard title="Recent activity" action={<Button size="sm" variant="ghost" onClick={activity.refresh}>Refresh</Button>}>
        <ActivityList calls={activity.calls} loading={activity.loading} />
      </SectionCard>

      <CreateTokenDialog open={creating} onClose={() => setCreating(false)} onCreate={handleCreate} creating={tokens.creating} />
      <TokenSecret secret={tokens.createdSecret} onClose={tokens.dismissSecret} />
    </SettingsFrame>
  );
}

export default AiAssistantsPage;
