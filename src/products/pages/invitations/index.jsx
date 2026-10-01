import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { Button, Skeleton, WorkingLine } from 'src/core/primitives';
import { PageTabs } from 'src/core/primitives/PageTabs';
import { UserPlus } from 'lucide-react';
import { useInvitationsPage } from 'src/products/invitations/hooks/useInvitationsPage.js';
import { INVITATION_TABS } from 'src/products/invitations/constants/constants.js';
import { sentColumns, receivedColumns } from './components/columns.jsx';
import { RulesPanel } from './components/RulesPanel.jsx';
import { invitationsStrings } from './strings.js';

const t = invitationsStrings;
const notice = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4';
const tableShell = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden';

function UsageLine({ usage }) {
  const w = usage.withdraw_invite;
  const r = usage.respond_invite;
  if (!w && !r) return null;
  return (
    <p className="text-[var(--ui-text-secondary)]">
      {w && <span>{t.usage.withdraw}: {w.usedDay} of {w.dailyCap}</span>}
      {w && r && <span> · </span>}
      {r && <span>{t.usage.respond}: {r.usedDay} of {r.dailyCap}</span>}
    </p>
  );
}

function LoadMore({ list, onClick }) {
  if (!list.cursor) return null;
  return (
    <div className="flex justify-center">
      <Button variant="ghost" onClick={onClick} loading={list.loadingMore} disabled={list.loadingMore}>{t.loadMore}</Button>
    </div>
  );
}

/**
 * Invitations: sent (withdraw), received (accept / decline) and the two
 * automations. Its own page because it is its own feature. Everything on it is
 * read live from LinkedIn when the tab opens; nothing is optimistic.
 */
export function HubInvitationsPage() {
  const navigate = useNavigate();
  const {
    tab, setTab, sent, received, rules, usage, staleAfterDays, needsAccount, busy,
    refresh, loadMore, withdraw, respond, saveRules,
  } = useInvitationsPage();

  const tabs = INVITATION_TABS.map((x) => ({
    ...x,
    label: t.tabs[x.id],
    ...(x.id === 'sent' && sent.loaded ? { count: sent.items.length } : {}),
    ...(x.id === 'received' && received.loaded ? { count: received.items.length } : {}),
  }));

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="page"
      actions={tab !== 'rules' ? (
        <Button variant="primary" onClick={refresh} disabled={needsAccount}>{t.refresh}</Button>
      ) : null}
    >
      <div className="flex flex-col gap-4">
        {needsAccount && (
          <div className={`${notice} flex items-center justify-between gap-3`}>
            <div>
              <p className="font-medium">{t.accountTitle}</p>
              <p className="text-[var(--ui-text-secondary)]">{t.accountBody}</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/dashboard/settings/linkedin')}>{t.accountCta}</Button>
          </div>
        )}

        <PageTabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
        {tab !== 'rules' && <UsageLine usage={usage} />}

        {tab === 'sent' && !needsAccount && (
          <>
            {sent.failed && <p role="alert" className="text-[var(--ui-text-secondary)]">{t.sent.failed}</p>}
            {sent.loading && sent.items.length === 0 && <WorkingLine verbs={['Reading', 'Checking']}>Reading your sent invitations from LinkedIn</WorkingLine>}
            <div className={tableShell}>
              <DataTable
                columns={sentColumns({ busy, onWithdraw: withdraw, staleAfterDays })}
                data={sent.items}
                rowKey={(row) => row.unipileInvitationId}
                loading={sent.loading && sent.items.length === 0}
                stickyHeader={false}
                emptyIcon={<UserPlus size={22} strokeWidth={1.6} />}
                emptyMessage={t.sent.emptyTitle}
                emptyHint={t.sent.emptyHint}
              />
            </div>
            <LoadMore list={sent} onClick={() => loadMore('sent')} />
            <p className="text-[var(--ui-text-secondary)]">{t.sent.footnote}</p>
          </>
        )}

        {tab === 'received' && !needsAccount && (
          <>
            {received.failed && <p role="alert" className="text-[var(--ui-text-secondary)]">{t.received.failed}</p>}
            {received.loading && received.items.length === 0 && <WorkingLine verbs={['Reading', 'Checking']}>Reading your incoming invitations from LinkedIn</WorkingLine>}
            <div className={tableShell}>
              <DataTable
                columns={receivedColumns({ busy, onRespond: respond })}
                data={received.items}
                rowKey={(row) => row.unipileInvitationId ?? row.inviterProviderId}
                loading={received.loading && received.items.length === 0}
                stickyHeader={false}
                emptyIcon={<UserPlus size={22} strokeWidth={1.6} />}
                emptyMessage={t.received.emptyTitle}
                emptyHint={t.received.emptyHint}
              />
            </div>
            <LoadMore list={received} onClick={() => loadMore('received')} />
            <p className="text-[var(--ui-text-secondary)]">{t.received.footnote}</p>
          </>
        )}

        {tab === 'rules' && (
          rules.loading && !rules.loaded
            ? <div className="flex flex-col gap-2 max-w-[640px]"><Skeleton width="60%" height={14} /><Skeleton width="80%" height={90} /></div>
            : <RulesPanel key={rules.loaded ? 'loaded' : 'default'} rules={rules.data} saving={rules.saving} onSave={saveRules} />
        )}
      </div>
    </DashboardLayout>
  );
}
