import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button, EmptyState, FilterPills, WorkingLine } from 'src/core/primitives';
import { SearchIcon, DownloadIcon } from 'src/core/icons';
import { useDiscoverPage } from 'src/products/discover/hooks/useDiscoverPage.js';
import { DISCOVER_TABS } from 'src/products/discover/constants/constants.js';
import { SearchPanel } from './components/SearchPanel.jsx';
import { CompanyList } from './components/CompanyList.jsx';
import { JobList } from './components/JobList.jsx';
import { PostList } from './components/PostList.jsx';
import { discoverStrings } from './strings.js';

const t = discoverStrings;

const card = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] overflow-hidden';
const notice = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4';

/** What a tab's error means on screen. */
function ErrorNotice({ error, onAccount }) {
  if (!error) return null;
  if (error.kind === 'account') {
    return (
      <div className={`${notice} flex items-center justify-between gap-3`} role="alert">
        <div>
          <p className="font-medium">{t.accountTitle}</p>
          <p className="text-[var(--ui-text-secondary)]">{t.accountBody}</p>
        </div>
        <Button variant="primary" onClick={onAccount}>{t.accountCta}</Button>
      </div>
    );
  }
  if (error.kind === 'locked') {
    return (
      <div className={notice} role="alert">
        <p className="font-medium">{t.lockedTitle}</p>
        <p className="text-[var(--ui-text-secondary)]">{t.lockedBody}</p>
      </div>
    );
  }
  if (error.kind === 'capped') {
    return (
      <div className={notice} role="alert">
        <p className="font-medium">{t.cappedTitle}</p>
        <p className="text-[var(--ui-text-secondary)]">{error.message || t.cappedBody}</p>
      </div>
    );
  }
  if (error.kind === 'input') {
    return <p className="text-[var(--ui-text-secondary)]" role="alert">{error.message || t.failedBody}</p>;
  }
  return <p className="text-[var(--ui-text-secondary)]" role="alert">{error.kind === 'rateLimited' ? t.rateLimited : t.failedBody}</p>;
}

/**
 * Discover: company, job and post search (plan M5). Its own page because it is
 * its own feature. Nothing searches until Search is pressed; every search spends
 * one of today's vendor search pages, shown in the header.
 */
export function HubDiscoverPage() {
  const navigate = useNavigate();
  const { tab, setTab, tabs, usage, search, loadMore, exportResults, importing, imported, importAuthors, dismissImported } = useDiscoverPage();

  const current = tabs[tab];
  const copy = t.tabs[tab];
  const capped = (usage && usage.used >= usage.cap) || current.error?.kind === 'capped';
  const noAccount = current.error?.kind === 'account';
  const rows = current.items;
  const hasResults = rows.length > 0;
  const showEmpty = !current.loading && !hasResults && !current.error;
  const [noun, nounPlural] = t.nouns[tab];
  const pageCount = current.query?.count;

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={usage ? <>{`${t.usageLabel(usage.used, usage.cap)}.`}</> : undefined}
      layout="fill"
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-4 shrink-0">
        <FilterPills
          ariaLabel="Search type"
          value={tab}
          onChange={setTab}
          options={DISCOVER_TABS.map(({ id, label }) => ({ id, label }))}
        />

        <SearchPanel key={tab} category={tab} loading={current.loading && !hasResults} disabled={capped || noAccount} onSearch={search} />

        <ErrorNotice error={current.error} onAccount={() => navigate('/dashboard/settings/linkedin')} />

        {tab === 'posts' && imported && (
          <div className={`${notice} flex items-center justify-between gap-3`} role="status">
            <div>
              <p className="font-medium">{t.posts.importedTitle(imported.imported ?? 0)}</p>
              <p className="text-[var(--ui-text-secondary)]">
                {t.posts.importedBody(imported.alreadyHad ?? 0, (imported.skipped?.company ?? 0) + (imported.skipped?.duplicate ?? 0) + (imported.skipped?.noId ?? 0))}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={dismissImported}>Dismiss</Button>
              <Button variant="primary" onClick={() => navigate('/hub/leads')}>{t.posts.openLeads}</Button>
            </div>
          </div>
        )}

        </div>

        {current.loading && !hasResults && <WorkingLine verbs={['Searching', 'Reading', 'Sorting']}>{t.searching}</WorkingLine>}

        {(hasResults || showEmpty) && (
          <div className={`${card} flex flex-col flex-1 min-h-0`}>
            {hasResults && (
              <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--ui-border)]">
                <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                  {t.loaded(rows.length, rows.length === 1 ? noun : nounPlural)}
                  {current.total != null && ` · ${t.resultsTotal(current.total)}`}
                </span>
                <Button size="sm" onClick={() => exportResults(tab)} title={t.exportHint}>
                  <DownloadIcon size={14} />
                  {t.exportCsv}
                </Button>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto">
            {hasResults && tab === 'companies' && <CompanyList companies={rows} />}
            {hasResults && tab === 'jobs' && <JobList jobs={rows} />}
            {hasResults && tab === 'posts' && (
              <PostList
                posts={rows}
                importing={importing}
                onImport={importAuthors}
                keywords={current.query?.keywords}
              />
            )}
            {showEmpty && (
              <EmptyState
                icon={<SearchIcon size={22} strokeWidth={1.6} />}
                title={current.searched ? copy.noResultsTitle : copy.emptyTitle}
                hint={current.searched ? copy.noResultsHint : copy.emptyHint}
              />
            )}
            </div>
            {hasResults && (
              <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--ui-border)]">
                <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
                  {current.cursor ? '' : t.noMoreResults}
                </span>
                {current.cursor && (
                  <Button onClick={() => loadMore(tab)} loading={current.loading} disabled={capped}>
                    {pageCount ? t.loadMoreCount(pageCount) : t.loadMore}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
