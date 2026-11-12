import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, EmptyState, Input, StatTile, useConfirm } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { getToastError } from 'src/shared/utils/apiError';
import { useOrganizations, useOrgAccounts, useOrgMembers, useOrgWorkspace } from 'src/core/org/hooks/useOrganization.js';
import { ORG_ACCOUNT_LABEL, ORG_ACCOUNT_TONE, ORG_COPY, ORG_PATHS } from 'src/core/org/constants/constants.js';
import { useLinkedInConnect } from 'src/products/settings/hooks/useLinkedInConnect.js';
import { createOrgConnectController } from 'src/products/settings/controller/orgConnect.js';
import { LinkedInConnectDialog } from 'src/products/settings/components/linkedinConnect/LinkedInConnectDialog.jsx';
import { OrgConnectSuccess } from './OrgConnectSuccess.jsx';

const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '';

function AccountRow({ account, disconnecting, onDisconnect, onReconnect }) {
  const label = account.name || account.publicIdentifier || 'LinkedIn member';
  const live = account.status !== 'DELETED';
  const needsReconnect = account.status === 'CREDENTIALS';
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)] truncate">{label}</p>
        <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] truncate">
          {account.connectedAt ? `Connected ${shortDate(account.connectedAt)}` : ''}
        </p>
      </div>
      <Badge size="sm" tone={ORG_ACCOUNT_TONE[account.status] || 'neutral'}>{ORG_ACCOUNT_LABEL[account.status] || account.status}</Badge>
      {needsReconnect && (
        <Button size="sm" variant="primary" onClick={() => onReconnect(account)}>{ORG_COPY.tab.reconnect}</Button>
      )}
      {live && (
        <Button size="sm" variant="secondary" loading={disconnecting === account.id} onClick={() => onDisconnect(account)}>
          {ORG_COPY.tab.disconnect}
        </Button>
      )}
    </div>
  );
}

/**
 * The org's workspace switch (V3b.2). Everyone sees the state. Only an owner gets a button: OFF is
 * always theirs; ON only for an organization Spurly does not manage (the server decides, this just
 * does not offer a button it would refuse).
 */
function WorkspaceCard({ org, onChanged }) {
  const confirm = useConfirm();
  const copy = ORG_COPY.tab;
  const { setWorkspace, busy, error } = useOrgWorkspace({ onChanged });
  const on = org.workspaceEnabled === true;
  const isOwner = org.role === 'owner';
  const canTurnOn = isOwner && org.kind === 'direct' && org.status !== 'suspended';

  function handleToggle() {
    const next = !on;
    confirm({
      title: next ? copy.workspaceConfirmOn : copy.workspaceConfirmOff,
      description: next ? copy.workspaceConfirmOnBody : copy.workspaceConfirmOffBody,
      confirmLabel: next ? copy.workspaceTurnOn : copy.workspaceTurnOff,
      tone: next ? 'primary' : 'danger',
    }).then((ok) => {
      if (ok) setWorkspace(org.id, next);
    });
  }

  let note = on ? copy.workspaceOn : copy.workspaceOff;
  if (!on && isOwner && !canTurnOn && org.status !== 'suspended') note = copy.workspaceByUs;
  const showButton = isOwner && (on || canTurnOn);

  return (
    <SectionCard title={copy.workspaceTitle}>
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">{note}</p>
        <Badge size="sm" tone={on ? 'success' : 'neutral'}>{on ? 'On' : 'Off'}</Badge>
        {showButton && (
          <Button size="sm" variant={on ? 'secondary' : 'primary'} loading={busy} onClick={handleToggle}>
            {on ? copy.workspaceTurnOff : copy.workspaceTurnOn}
          </Button>
        )}
      </div>
      {on && org.credits != null && (
        <p className="mt-2 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">{copy.credits(org.credits)}</p>
      )}
      {error && <p role="alert" className="mt-2 text-[var(--ui-danger-fg)]">{getToastError(error, "Couldn't change the workspace")}</p>}
    </SectionCard>
  );
}

/**
 * Who can sign in to this organization. Everyone sees the list; only an owner invites, withdraws
 * an invite or removes someone. An invited person signs in at the org login page with their email.
 */
function MembersCard({ org }) {
  const confirm = useConfirm();
  const copy = ORG_COPY.tab;
  const { data, error, busy, changeError, invite, revoke, remove } = useOrgMembers(org.id);
  const [email, setEmail] = useState('');
  const loginUrl = `${window.location.origin}${ORG_PATHS.LOGIN}`;

  function onInvite(e) {
    e.preventDefault();
    invite(email.trim());
    setEmail('');
  }

  function onRemove(member) {
    confirm({ title: copy.removeTitle(member.name || member.email), description: copy.removeBody, confirmLabel: copy.remove, tone: 'danger' })
      .then((ok) => { if (ok) remove(member.id); });
  }

  function onRevoke(item) {
    confirm({ title: copy.revokeTitle, description: copy.revokeBody, confirmLabel: copy.revoke, tone: 'danger' })
      .then((ok) => { if (ok) revoke(item.id); });
  }

  return (
    <SectionCard title={copy.membersTitle} noPadding>
      <p className="px-4 pt-3 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">{copy.membersHelp}</p>
      {error && <p role="alert" className="px-4 py-3 text-[var(--ui-danger-fg)]">{getToastError(error, "Couldn't load the members")}</p>}
      {data?.members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0">
          <div className="min-w-0 flex-1">
            <p className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)] truncate">{m.name || m.email}{m.isYou ? ` (${copy.you})` : ''}</p>
            {m.name && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] truncate">{m.email}</p>}
          </div>
          <Badge size="sm" tone="neutral">{m.role === 'owner' ? copy.owner : copy.member}</Badge>
          {data.canManage && !m.isYou && m.role !== 'owner' && (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onRemove(m)}>{copy.remove}</Button>
          )}
        </div>
      ))}
      {data?.invites.map((i) => (
        <div key={i.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0">
          <p className="min-w-0 flex-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] truncate">{i.email}</p>
          <Badge size="sm" tone="info">{copy.invited}</Badge>
          {data.canManage && <Button size="sm" variant="secondary" disabled={busy} onClick={() => onRevoke(i)}>{copy.revoke}</Button>}
        </div>
      ))}
      {data?.canManage && org.status !== 'suspended' && (
        <form className="flex items-center gap-2 px-4 py-3" onSubmit={onInvite} noValidate>
          <Input fullWidth type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={copy.invitePlaceholder} aria-label="Email to invite" maxLength={254} className="[&>input]:w-full" />
          <Button type="submit" size="sm" variant="primary" loading={busy} disabled={!email.trim()}>{copy.inviteSend}</Button>
        </form>
      )}
      {data?.canManage && <p className="px-4 pb-3 text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">{copy.inviteHelp(loginUrl)}</p>}
      {changeError && <p role="alert" className="px-4 pb-3 text-[var(--ui-danger-fg)]">{getToastError(changeError, "Couldn't update the members")}</p>}
    </SectionCard>
  );
}

/** One org: counts, 30-day usage, and its LinkedIn accounts with a disconnect. */
function OrgBlock({ org, onChanged }) {
  const confirm = useConfirm();
  const copy = ORG_COPY.tab;
  const { accounts, error, disconnecting, disconnectError, disconnect, reload } = useOrgAccounts(org.id, { onDisconnected: onChanged });

  // Connect (or reconnect one account) through the same LinkedIn sign-in dialog a solo member uses.
  const [reconnectId, setReconnectId] = useState(null);
  const connectController = useMemo(() => createOrgConnectController({ orgId: org.id, accountId: reconnectId }), [org.id, reconnectId]);
  const connect = useLinkedInConnect({
    controller: connectController,
    onConnected: useCallback(() => { reload(); onChanged?.(); }, [reload, onChanged]),
  });

  function handleConnect() {
    setReconnectId(null);
    connect.openDialog();
  }

  function handleReconnect(account) {
    setReconnectId(account.id);
    connect.openDialog();
  }

  function handleDisconnect(account) {
    confirm({
      title: copy.confirmTitle(account.name || account.publicIdentifier || 'this account'),
      description: copy.confirmBody,
      confirmLabel: copy.disconnect,
    }).then((ok) => {
      if (ok) disconnect(account.id);
    });
  }

  const title = org.name || org.externalId;
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label={copy.connected} value={org.accounts?.connected ?? 0} countUp={false} caption={title} />
        <StatTile label={copy.peak} value={org.usage?.peak?.count ?? 0} countUp={false} />
        <StatTile label={copy.distinct} value={org.usage?.distinct ?? 0} countUp={false} />
      </div>
      <WorkspaceCard org={org} onChanged={onChanged} />
      <MembersCard org={org} />
      <SectionCard title={copy.accountsTitle} noPadding>
        {org.status === 'suspended' ? (
          <p role="status" className="px-4 py-3 text-[var(--ui-warning-fg)]">{copy.suspended}</p>
        ) : (
          <div className="flex justify-end px-4 py-3 border-b border-[var(--ui-border-hairline)]">
            <Button size="sm" variant="primary" onClick={handleConnect}>{copy.connect}</Button>
          </div>
        )}
        {error && <p role="alert" className="px-4 py-3 text-[var(--ui-danger-fg)]">{getToastError(error, "Couldn't load the accounts")}</p>}
        {disconnectError && <p role="alert" className="px-4 py-3 text-[var(--ui-danger-fg)]">{getToastError(disconnectError, "Couldn't disconnect that account")}</p>}
        {accounts && accounts.length === 0 && !error && <EmptyState compact title={copy.empty} />}
        {accounts?.map((a) => (
          <AccountRow key={a.id} account={a} disconnecting={disconnecting} onDisconnect={handleDisconnect} onReconnect={handleReconnect} />
        ))}
      </SectionCard>
      <LinkedInConnectDialog
        connect={connect}
        headings={ORG_COPY.connect.headings}
        renderSuccess={(account) => <OrgConnectSuccess account={account} />}
      />
    </>
  );
}

/** Settings -> Organization, for an org member's session. */
export function OrganizationTab() {
  const { orgs, error, reload } = useOrganizations();
  const refresh = useCallback(() => reload(), [reload]);

  if (error) return <p role="alert" className="text-[var(--ui-danger-fg)]">{getToastError(error, "Couldn't load your organization")}</p>;
  if (!orgs) return <p className="text-[var(--ui-text-secondary)]">Loading…</p>;
  return orgs.map((org) => <OrgBlock key={org.id} org={org} onChanged={refresh} />);
}

export default OrganizationTab;
