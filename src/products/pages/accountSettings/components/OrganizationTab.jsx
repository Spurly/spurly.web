import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, EmptyState, StatTile, useConfirm } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { getToastError } from 'src/shared/utils/apiError';
import { useOrganizations, useOrgAccounts } from 'src/core/org/hooks/useOrganization.js';
import { ORG_ACCOUNT_LABEL, ORG_ACCOUNT_TONE, ORG_COPY } from 'src/core/org/constants/constants.js';
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
