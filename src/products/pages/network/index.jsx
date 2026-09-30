import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { Button, StatTile, WorkingLine } from 'src/core/primitives';
import { NetworkIcon } from 'src/core/icons';
import { useNetworkPage } from 'src/products/network/hooks/useNetworkPage.js';
import { LeadDrawer } from 'src/products/pages/leads/components/LeadDrawer.jsx';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { networkColumns } from './components/columns.jsx';
import { networkStrings } from './strings.js';

const t = networkStrings;

const ago = (value) => {
  const rel = relativeTime(value);
  if (!rel) return t.tiles.never;
  return rel === 'just now' ? rel : `${rel} ago`;
};

/** "in 5h" for a future time; "Soon" once it has passed. */
function until(value) {
  if (!value) return '—';
  const ms = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return t.tiles.soon;
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  return hours < 48 ? `in ${hours}h` : `in ${Math.round(hours / 24)}d`;
}

/**
 * Network — the person's own LinkedIn connections, synced in the background.
 * Its own page because it is its own feature: one list that Spurly keeps
 * current, not a search the person runs.
 */
export function HubNetworkPage() {
  const navigate = useNavigate();
  const { network, loading, connections, pagination, listLoading, q, search, goToPage, sync, starting, needsAccount } =
    useNetworkPage();
  const [selectedLead, setSelectedLead] = useState(null);
  const columns = useMemo(() => networkColumns, []);

  const exists = Boolean(network?.exists);
  const syncing = Boolean(network?.syncing);
  const failed = exists && network.status === 'failed';
  const firstSync = exists && !network.firstSyncDone && !failed;

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="page"
      actions={
        exists ? (
          <Button variant="primary" onClick={sync} disabled={starting || syncing}>
            {t.syncNow}
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        {needsAccount && (
          <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{t.accountTitle}</p>
              <p className="text-[var(--ui-text-secondary)]">{t.accountBody}</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/dashboard/settings/linkedin')}>
              {t.accountCta}
            </Button>
          </div>
        )}

        {network?.notice && !syncing && (
          <p className="text-[var(--ui-text-secondary)]" role="status">{network.notice}</p>
        )}
        {network?.status === 'failed' && (
          <p className="text-[var(--ui-text-secondary)]" role="alert">{t.failed}</p>
        )}

        {syncing && (
          <WorkingLine
            verbs={['Syncing', 'Reading', 'Adding']}
            trailing={`${(network.connectionCount ?? 0).toLocaleString()} so far`}
          >
            {t.working}
          </WorkingLine>
        )}

        {exists && (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            <StatTile
              label={t.tiles.connections}
              value={(network.connectionCount ?? 0).toLocaleString()}
              caption={failed ? 'Last sync did not finish' : firstSync ? 'First sync in progress' : 'People you are connected to'}
            />
            <StatTile label={t.tiles.lastChecked} value={ago(network.lastCheckedAt)} caption="Newest connections are checked first" />
            <StatTile label={t.tiles.nextCheck} value={until(network.nextCheckAt)} caption="Runs on its own" />
          </div>
        )}

        <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
          <DataTable
            columns={columns}
            data={exists ? connections : []}
            rowKey={(row) => row._id}
            loading={loading || (exists && listLoading && connections.length === 0)}
            stickyHeader={false}
            onRowClick={(row) => setSelectedLead(row)}
            emptyIcon={<NetworkIcon size={22} strokeWidth={1.6} />}
            emptyMessage={!exists ? t.emptyTitle : q ? t.noMatchTitle : syncing ? 'Connections are arriving' : t.emptyTitle}
            emptyHint={!exists ? t.emptyHint : q ? t.noMatchHint : undefined}
            emptyAction={
              !exists ? (
                <Button variant="primary" onClick={sync} disabled={starting}>
                  {t.syncFirst}
                </Button>
              ) : null
            }
            pagination={
              exists
                ? { page: pagination.page, pageSize: pagination.limit, total: pagination.total, onPageChange: goToPage }
                : undefined
            }
            toolbar={
              exists
                ? { searchValue: q, onSearch: search, searchPlaceholder: t.searchPlaceholder }
                : undefined
            }
          />
        </div>

        {exists && <p className="text-[var(--ui-text-secondary)]">{t.footnote}</p>}
      </div>

      {selectedLead && (
        <LeadDrawer key={selectedLead._id} lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </DashboardLayout>
  );
}
