import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { DataTable } from 'src/core/DataTable';
import { Button, FilterPills, StatTile, WorkingLine } from 'src/core/primitives';
import { EyeIcon } from 'src/core/icons';
import { useProfileViewersPage } from 'src/products/profileViewers/hooks/useProfileViewersPage.js';
import { DEGREE_FILTERS } from 'src/products/profileViewers/constants/constants.js';
import { formatViewedAgo } from 'src/products/profileViewers/format.js';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { viewerColumns } from './components/columns.jsx';
import { viewersStrings } from './strings.js';

const t = viewersStrings;

const notice = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4';

/** "checked 2h ago" for the header line. */
function checkedAgo(value) {
  const rel = relativeTime(value);
  if (!rel) return null;
  return rel === 'just now' ? 'checked just now' : `checked ${rel} ago`;
}

/**
 * Profile viewers — who looked at the person's own LinkedIn profile.
 * Its own page because it is its own feature. The list is what Spurly has
 * stored (instant); "Sync now" is the only thing that asks LinkedIn.
 */
export function HubProfileViewersPage() {
  const navigate = useNavigate();
  const { data, loading, degreeId, changeDegree, goToPage, sync, syncing, needsAccount, rejected } = useProfileViewersPage();

  const viewers = data?.viewers ?? [];
  const summary = data?.summary;
  const state = data?.state;
  const noAccount = needsAccount || (data && data.account?.connected === false);
  const hasStored = (summary?.identifiedTotal ?? 0) > 0;
  const queryRejected = rejected || state?.lastErrorCode === 'BAD_REQUEST';
  const lastFailed = Boolean(state?.lastError) && !queryRejected;
  const filtering = degreeId !== 'all';
  const checked = checkedAgo(state?.lastSyncAt);
  const partial = data?.partial ?? [];

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={checked ? `${t.pageSubtitle} (${checked})` : t.pageSubtitle}
      layout="page"
      actions={
        <Button variant="primary" onClick={sync} disabled={syncing || noAccount}>
          {t.syncNow}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {noAccount && (
          <div className={`${notice} flex items-center justify-between gap-3`}>
            <div>
              <p className="font-medium">{t.accountTitle}</p>
              <p className="text-[var(--ui-text-secondary)]">{t.accountBody}</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/dashboard/settings/linkedin')}>
              {t.accountCta}
            </Button>
          </div>
        )}

        {state?.limited && !noAccount && (
          <div className={notice} role="status">
            <p className="font-medium">{t.limitedTitle}</p>
            <p className="text-[var(--ui-text-secondary)]">{t.limitedBody}</p>
          </div>
        )}

        {queryRejected && (
          <p className="text-[var(--ui-text-secondary)]" role="alert">{t.rejected}</p>
        )}
        {lastFailed && (
          <p className="text-[var(--ui-text-secondary)]" role="alert">{t.failed}</p>
        )}

        {syncing && (
          <WorkingLine verbs={['Reading', 'Checking', 'Saving']}>Reading your profile viewers from LinkedIn</WorkingLine>
        )}

        {data && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatTile label={t.tiles.last7d} value={(summary.last7d ?? 0).toLocaleString()} caption={t.tileCaptions.last7d} />
            <StatTile label={t.tiles.last30d} value={(summary.last30d ?? 0).toLocaleString()} caption={t.tileCaptions.last30d} />
            <StatTile label={t.tiles.stored} value={(summary.identifiedTotal ?? 0).toLocaleString()} caption={t.tileCaptions.stored} />
            <StatTile label={t.tiles.private} value={(summary.partialCount ?? 0).toLocaleString()} caption={t.tileCaptions.private} />
          </div>
        )}

        <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden">
          <DataTable
            columns={viewerColumns}
            data={viewers}
            rowKey={(row) => row.providerId}
            loading={loading}
            stickyHeader={false}
            emptyIcon={<EyeIcon size={22} strokeWidth={1.6} />}
            emptyMessage={filtering ? t.noMatchTitle : t.emptyTitle}
            emptyHint={filtering ? t.noMatchHint : t.emptyHint}
            emptyAction={
              !filtering && !hasStored && !noAccount ? (
                <Button variant="primary" onClick={sync} disabled={syncing}>
                  {t.syncNow}
                </Button>
              ) : null
            }
            pagination={
              data
                ? { page: data.page, pageSize: data.limit, total: data.total, onPageChange: goToPage }
                : undefined
            }
            toolbar={{
              chips: (
                <FilterPills
                  ariaLabel="Connection level"
                  size="sm"
                  value={degreeId}
                  onChange={changeDegree}
                  options={DEGREE_FILTERS.map(({ id, label }) => ({ id, label }))}
                />
              ),
            }}
          />
        </div>

        {partial.length > 0 && (
          <div className={notice}>
            <p className="font-medium">{t.privateTitle}</p>
            <p className="text-[var(--ui-text-secondary)] mb-2">{t.privateBody}</p>
            <ul className="flex flex-col gap-1">
              {partial.map((row, i) => (
                <li key={`${row.descriptor}-${i}`} className="flex items-center justify-between gap-3">
                  <span>{row.descriptor}</span>
                  <span className="text-[var(--ui-text-secondary)]">{formatViewedAgo(row.viewedAgo)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[var(--ui-text-secondary)]">{t.footnote}</p>
      </div>
    </DashboardLayout>
  );
}
