import { useState, useMemo, useEffect, useRef } from 'react';
import { RotateCcw, Trash2, AlertCircle, X, UserSearch, Search } from 'lucide-react';
import { DataTable } from 'src/core/DataTable';
import { Button, FilterPills, IconButton, WorkingLine, useToast } from 'src/core/primitives';
import { LOOKUP_EVENTS } from 'src/products/import/constants/constants.js';
import { buildLookupColumns } from './lookupColumns.jsx';
import { LookupReviewDrawer } from './LookupReviewDrawer.jsx';

/**
 * Find profiles — CSV rows that had a name + company but no LinkedIn URL.
 *
 * Same table as Staged leads: search, status filter, selection + bulk
 * actions, pagination. Spurly searches each row on LinkedIn in the
 * background (backend importedLeads/lookupJob.js):
 *   - one clear match → "Matched", already added to Staged leads
 *   - several people fit (five Rahul Sharmas at TCS) → "Needs review": NOTHING
 *     is added; the row opens a side drawer where the user picks one or none
 *   - nobody → "Not found", can be searched again or skipped
 */

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'needs_review', label: 'Needs review', stat: 'needsReview' },
  { id: 'in_progress', label: 'Searching', stat: 'inFlight' },
  { id: 'found', label: 'Found', stat: 'found' },
  { id: 'not_found', label: 'Not found', stat: 'notFound' },
];

const SKIPPABLE = new Set(['queued', 'needs_review', 'not_found', 'failed']);
const RETRYABLE = new Set(['not_found', 'failed']);

/**
 * `controlled` — the page's pipeline bar picks the status, so the pills are
 * hidden. `reviewSignal` — bumping it opens the review drawer on the first
 * row that needs review (the pipeline's "Review" button).
 */
export function LookupPanel({ store, controlled = false, reviewSignal = 0 }) {
  const {
    rows, stats, pagination, page, setPage, loading, error, actionError, clearActionError,
    statusFilter, setStatusFilter, search, setSearch, busy, eventEmitter, pick, dismiss, retry,
  } = store;
  const toast = useToast();

  const [selected, setSelected] = useState(new Set());
  const [reviewId, setReviewId] = useState(null);

  // Selection belongs to the rows on screen — see StagingPanel for why.
  useEffect(() => {
    const t = setTimeout(() => setSelected(new Set()), 0);
    return () => clearTimeout(t);
  }, [statusFilter, page, search]);

  const reviewQueue = useMemo(() => rows.filter((r) => r.status === 'needs_review'), [rows]);

  // Open the first row to review once the needs_review rows are on screen.
  const pendingReviewOpen = useRef(0);
  useEffect(() => {
    if (reviewSignal) pendingReviewOpen.current = reviewSignal;
  }, [reviewSignal]);
  useEffect(() => {
    if (!pendingReviewOpen.current || reviewQueue.length === 0) return undefined;
    const t = setTimeout(() => {
      pendingReviewOpen.current = 0;
      setReviewId(reviewQueue[0]._id);
    }, 0);
    return () => clearTimeout(t);
  }, [reviewQueue, reviewSignal]);
  const reviewRow = reviewQueue.find((r) => r._id === reviewId) || null;
  const reviewPosition = reviewRow ? reviewQueue.indexOf(reviewRow) + 1 : 0;

  const nextReviewId = (fromId) => {
    const rest = reviewQueue.filter((r) => r._id !== fromId);
    const idx = reviewQueue.findIndex((r) => r._id === fromId);
    return (reviewQueue.slice(idx + 1).find((r) => r._id !== fromId) || rest[0])?._id ?? null;
  };

  const advance = (fromId, message) => {
    const next = nextReviewId(fromId);
    setReviewId(next);
    if (!next) toast.success(message, { description: 'Nothing left to review on this page.' });
  };

  const handlePick = (profileUrl) => {
    const id = reviewRow?._id;
    if (!id) return;
    eventEmitter.once(LOOKUP_EVENTS.PICK_SUCCESS, () => advance(id, 'Added to Staged leads'));
    pick(id, profileUrl);
  };

  const handleNone = () => {
    const id = reviewRow?._id;
    if (!id) return;
    eventEmitter.once(LOOKUP_EVENTS.DISMISS_SUCCESS, () => advance(id, 'Skipped'));
    dismiss([id]);
  };

  const selectedRows = rows.filter((r) => selected.has(r._id));
  const skipIds = selectedRows.filter((r) => SKIPPABLE.has(r.status)).map((r) => r._id);
  const retryIds = selectedRows.filter((r) => RETRYABLE.has(r.status)).map((r) => r._id);

  const handleBulkSkip = () => {
    eventEmitter.once(LOOKUP_EVENTS.DISMISS_SUCCESS, ({ dismissed } = {}) => {
      setSelected(new Set());
      toast.success(`Skipped ${(dismissed || 0).toLocaleString()}`);
    });
    dismiss(skipIds);
  };

  const handleBulkRetry = () => {
    eventEmitter.once(LOOKUP_EVENTS.RETRY_SUCCESS, ({ requeued } = {}) => {
      setSelected(new Set());
      toast.success(`Searching again for ${(requeued || 0).toLocaleString()}`);
    });
    retry(retryIds);
  };

  const columns = useMemo(() => buildLookupColumns(), []);

  const allCount = Object.values(stats.byStatus || {}).reduce((a, b) => a + b, 0);
  const pills = FILTERS.map((f) => ({ id: f.id, label: f.label, count: f.stat ? stats[f.stat] ?? 0 : allCount }));

  const banner = actionError ? (
    <div className="relative flex items-center gap-3 px-4 py-2.5 bg-[var(--ui-danger-tint)] border-b border-[var(--ui-border)]">
      <AlertCircle size={16} className="shrink-0" style={{ color: 'var(--ui-danger)' }} />
      <p className="flex-1 text-[length:var(--ui-t-label)] pr-6 text-[var(--ui-text-secondary)]">{actionError}</p>
      <span className="absolute top-1/2 -translate-y-1/2 right-2">
        <IconButton size="sm" icon={<X size={14} />} label="Dismiss" onClick={clearActionError} />
      </span>
    </div>
  ) : stats.inFlight > 0 ? (
    <WorkingLine verbs={['Searching LinkedIn', 'Matching names', 'Checking companies']} variant="band">
      {stats.inFlight.toLocaleString()} left · runs in the background, this table updates itself
    </WorkingLine>
  ) : null;

  const reviewAction =
    reviewQueue.length > 0 ? (
      <Button
        size="sm"
        variant="primary"
        leadingIcon={<UserSearch size={13} />}
        onClick={() => setReviewId(reviewQueue[0]._id)}
      >
        Review {reviewQueue.length}
      </Button>
    ) : null;

  const emptyCopy = {
    all: ['No lookups yet', 'Import a CSV with names and companies but no LinkedIn URLs, and Spurly finds the profiles here.'],
    needs_review: ['Nothing to review', 'When several people match a name and company, they wait here for you to pick the right one.'],
    in_progress: ['Nothing being searched', 'Every row has been looked up.'],
    found: ['Nothing found yet', 'Profiles Spurly found — or you picked — show here, and are already in Staged leads.'],
    not_found: ['Nobody missing', 'Rows where LinkedIn showed nobody by that name at that company show here.'],
  }[statusFilter] || ['Nothing here', ''];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DataTable
        className="flex-1"
        columns={columns}
        data={rows}
        rowKey={(row) => row._id}
        loading={loading}
        error={error}
        banner={banner}
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        onRowClick={(row) => {
          if (row.status === 'needs_review') setReviewId(row._id);
        }}
        rowActions={(row) =>
          row.status === 'needs_review'
            ? [{ key: 'review', label: 'Choose', icon: <UserSearch size={13} />, onClick: () => setReviewId(row._id) }]
            : RETRYABLE.has(row.status)
              ? [{ key: 'retry', label: 'Search again', icon: <RotateCcw size={13} />, onClick: () => retry([row._id]) }]
              : []
        }
        emptyIcon={search ? <Search size={22} /> : <UserSearch size={22} />}
        emptyMessage={search ? 'No rows match your search' : emptyCopy[0]}
        emptyHint={search ? 'Try a different name or company' : emptyCopy[1]}
        toolbar={{
          searchValue: search,
          onSearch: setSearch,
          searchPlaceholder: 'Search by name, company, title...',
          chips: controlled ? null : (
            <FilterPills size="sm" options={pills} value={statusFilter} onChange={setStatusFilter} ariaLabel="Lookup status" />
          ),
          actions: reviewAction,
          bulkActions:
            selected.size > 0 ? (
              <>
                {retryIds.length > 0 && (
                  <Button size="sm" variant="secondary" leadingIcon={<RotateCcw size={13} />} onClick={handleBulkRetry} disabled={busy}>
                    Search again ({retryIds.length})
                  </Button>
                )}
                {skipIds.length > 0 && (
                  <Button size="sm" variant="dangerSoft" leadingIcon={<Trash2 size={13} />} onClick={handleBulkSkip} disabled={busy}>
                    Skip ({skipIds.length})
                  </Button>
                )}
              </>
            ) : null,
        }}
        pagination={{
          page,
          pageSize: pagination.limit,
          total: pagination.total,
          onPageChange: setPage,
        }}
      />

      <LookupReviewDrawer
        key={reviewRow?._id || 'closed'}
        row={reviewRow}
        position={reviewPosition}
        total={reviewQueue.length}
        busy={busy}
        onPick={handlePick}
        onNone={handleNone}
        onSkip={() => setReviewId(nextReviewId(reviewRow?._id))}
        onClose={() => setReviewId(null)}
      />
    </div>
  );
}
