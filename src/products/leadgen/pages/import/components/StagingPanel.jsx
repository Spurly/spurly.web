import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Trash2, Square, AlertCircle, X, UploadCloud, Clock, Upload } from 'lucide-react';
import { DataTable } from 'src/platform/DataTable';
import { Button, useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import hubImportGateway from 'src/platform/hubImport/gateway/hubImport.js';
import { ImportToHubModal } from 'src/products/leadgen/shared/components/ImportToHubModal.jsx';
import { stagingColumns } from './stagingColumns.jsx';

/**
 * Every status a staged lead can be in needs a chip. Omitting one produces the
 * worst possible reading: "All 12" beside a row of zeros, which looks like the
 * page is broken rather than like a status simply isn't represented.
 * `queued` folds in `enriching` — mid-run is a kind of waiting, and splitting
 * them would give the user a chip that's empty almost always.
 */
const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Not enriched' },
  { id: 'queued', label: 'Queued' },
  { id: 'enriched', label: 'Enriched' },
  { id: 'failed', label: 'Failed' },
];

/**
 * The staging table: everything imported but not yet moved into People.
 *
 * Two actions drive the pipeline — Enrich (visit each profile via the
 * extension) and Move to People (promote and drain from staging).
 */
export function StagingPanel({ store, onGoToUpload }) {
  const {
    leads,
    stats,
    pagination,
    loading,
    error,
    actionError,
    clearActionError,
    actionNotice,
    clearActionNotice,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    enriching,
    progress,
    busy,
    enrichSelected,
    stopEnriching,
    promoteSelected,
    deleteSelected,
  } = store;

  const toast = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importingToHub, setImportingToHub] = useState(false);

  /* The block below is the real home for these: they're long, instructional
     ("…enable it, then press Resume") and stay relevant until acted on. The
     toast is only a pointer to it — fixed copy, no detail — so a paragraph of
     setup instructions never ends up in a 4-second notification. */
  useEffect(() => {
    if (actionError) toast.error("Couldn't enrich these leads", { description: 'See the note above the table.' });
  }, [actionError, toast]);

  useEffect(() => {
    if (actionNotice) toast.info('Leads queued', { description: 'See the note above the table.' });
  }, [actionNotice, toast]);

  // Selection is keyed on rows from the CURRENT page/filter. Carrying it across
  // a filter or page change would leave ids selected that aren't on screen —
  // the button would read "Move 12" while showing 3 checked rows, and act on
  // all 12. Clearing is the honest behaviour.
  useEffect(() => {
    setSelected(new Set());
  }, [statusFilter, page, search]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedRows = useMemo(
    () => leads.filter((l) => selected.has(l._id)),
    [leads, selected],
  );

  // Anything not already enriched is worth acting on — INCLUDING rows sitting
  // in 'queued'. Those are leads whose last start never reached the extension;
  // excluding them made the button read "Enrich (0)" and left them permanently
  // stuck with no way to retry.
  const enrichableRows = selectedRows.filter((r) => r.enrichStatus !== 'enriched');
  const enrichableCount = enrichableRows.length;
  // Purely for the button label: "Resume" is honest when nothing is new.
  const resumeOnly =
    enrichableCount > 0 && enrichableRows.every((r) => ['queued', 'enriching'].includes(r.enrichStatus));
  // Promoting an un-enriched lead is allowed (it's just a thin record), but
  // it's worth telling the user before they do it by accident.
  const unenrichedSelected = selectedRows.filter((r) => r.enrichStatus !== 'enriched').length;

  const clearSelection = () => setSelected(new Set());

  const handleEnrich = async () => {
    const ids = enrichableRows.map((r) => r._id);
    if (ids.length === 0) return;
    await enrichSelected(ids);
  };

  const handlePromote = async () => {
    if (selectedIds.length === 0) return;
    const res = await promoteSelected(selectedIds);
    if (res?.ok) {
      clearSelection();
      toast.success(`Moved ${(res.promoted || selectedIds.length).toLocaleString()} to Contacts`);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    const res = await deleteSelected(selectedIds);
    if (res?.ok) {
      clearSelection();
      toast.success(`Deleted ${(res.deleted || selectedIds.length).toLocaleString()} staged leads`);
    }
    setConfirmDelete(false);
  };

  /**
   * "Import to Hub" — the staged-rows counterpart to the People page's same
   * action. Seeds come straight from whatever the CSV mapped onto these rows
   * (enriched or not); Hub re-resolves each one through Unipile on import, so
   * an un-enriched staged row still arrives in Hub complete.
   */
  const buildHubSeeds = () =>
    selectedRows
      .map((row) => ({
        profileUrl: row.profileUrl,
        name: row.name,
        headline: row.title,
        currentTitle: row.title,
        companyName: row.company,
        location: row.location,
        profilePictureUrl: row.avatar,
      }))
      .filter((seed) => seed.profileUrl);

  const openImportToHub = () => {
    if (selectedIds.length === 0) return;
    setImportModalOpen(true);
  };

  const closeImportToHub = () => {
    if (importingToHub) return;
    setImportModalOpen(false);
  };

  const submitImportToHub = async (name) => {
    if (importingToHub) return;
    const seeds = buildHubSeeds();
    if (seeds.length === 0) {
      toast.error("None of the selected leads have a LinkedIn URL to import");
      return;
    }

    setImportingToHub(true);
    try {
      const audience = await hubImportGateway.createManualAudience({ name, seeds });
      setImportModalOpen(false);
      clearSelection();
      toast.success(
        `Importing ${seeds.length} profile${seeds.length === 1 ? '' : 's'} into Hub`,
        {
          action: {
            label: 'View in Hub',
            onClick: () => navigate(`/hub/leads?searchId=${audience._id}`),
          },
        },
      );
    } catch (e) {
      console.error('[Import] Import to Hub error:', e);
      toast.error(getToastError(e, "Couldn't start the Hub import"));
    } finally {
      setImportingToHub(false);
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  // ── Empty state ────────────────────────────────────────────────────────
  if (!loading && stats.total === 0 && !search && statusFilter === 'all') {
    return (
      <div
        className="flex flex-col items-center text-center gap-4 py-16 px-[var(--ui-pad-lg)] rounded-[var(--ui-radius-lg)]"
        style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
      >
        <div
          className="w-14 h-14 rounded-[var(--ui-radius-lg)] grid place-items-center"
          style={{ background: 'var(--ui-accent-tint)' }}
        >
          <UploadCloud size={26} style={{ color: 'var(--ui-accent)' }} />
        </div>
        <div>
          <h2 className="text-[var(--ui-t-section)] font-medium text-[var(--ui-text-primary)] tracking-[-0.012em]">
            Nothing staged yet
          </h2>
          <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1.5 max-w-md">
            Import a CSV and the leads will land here. Enrich them to pull in emails and
            experience, then move the good ones into Contacts.
          </p>
        </div>
        <Button variant="primary" onClick={onGoToUpload} trailingIcon={<ArrowRight size={16} />}>
          Import a CSV
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Action error */}
      {actionError && (
        <div
          className="relative flex gap-3 px-4 py-3 rounded-[var(--ui-radius-lg)]"
          style={{ background: 'var(--ui-danger-tint)', border: '1px solid rgba(255,69,58,0.22)' }}
        >
          <AlertCircle size={17} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-danger)' }} />
          <p className="flex-1 text-[var(--ui-t-body)] pr-6" style={{ color: 'var(--ui-text-secondary)' }}>
            {actionError}
          </p>
          <button
            onClick={clearActionError}
            className="absolute top-2.5 right-2.5 w-6 h-6 grid place-items-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-hover)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Informational notice — queued but not yet handed off. Not a failure,
          so it must not look like one. */}
      {actionNotice && (
        <div
          className="relative flex gap-3 px-4 py-3 rounded-[var(--ui-radius-lg)]"
          style={{ background: 'var(--ui-warning-tint)', border: '1px solid rgba(255,159,10,0.22)' }}
        >
          <Clock size={17} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-warning)' }} />
          <p className="flex-1 text-[var(--ui-t-body)] pr-6" style={{ color: 'var(--ui-text-secondary)' }}>
            {actionNotice}
          </p>
          <button
            onClick={clearActionNotice}
            className="absolute top-2.5 right-2.5 w-6 h-6 grid place-items-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-hover)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Live enrichment progress */}
      {enriching && (
        <div
          className="flex items-center gap-4 px-[var(--ui-pad-lg)] py-3.5 rounded-[var(--ui-radius-lg)]"
          style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
              Enriching profiles — {progress.current} / {progress.total}
            </p>
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5">
              Spurly is visiting each profile in a background tab. You can leave this page — it
              keeps running.
            </p>
            <div
              className="mt-2 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--ui-surface-sunken)' }}
            >
              <div
                className="h-full rounded-full transition-colors duration-500"
                style={{ width: `${pct}%`, background: 'var(--ui-accent)' }}
              />
            </div>
          </div>
          <Button variant="ghost" size="sm" leadingIcon={<Square size={14} />} onClick={stopEnriching}>
            Stop
          </Button>
        </div>
      )}

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((filter) => {
          const count =
            filter.id === 'all' ? stats.total : stats.byStatus?.[filter.id] ?? 0;
          const active = statusFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] font-medium transition-colors"
              style={{
                background: active ? 'var(--ui-accent-tint)' : 'var(--ui-surface-card)',
                color: active ? 'var(--ui-accent)' : 'var(--ui-text-secondary)',
                border: `1px solid ${active ? 'transparent' : 'var(--ui-border-hairline)'}`,
              }}
            >
              {filter.label}
              <span className="tabular-nums" style={{ opacity: 0.7 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Staging table */}
      <div className="rounded-[var(--ui-radius-lg)] overflow-hidden" style={{ border: '1px solid var(--ui-border-hairline)' }}>
        <DataTable
          columns={stagingColumns}
          data={leads}
          rowKey={(row) => row._id}
          loading={loading}
          error={error}
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          emptyMessage={
            search ? 'No staged leads match your search' : 'No leads in this status'
          }
          emptyHint={
            search ? 'Try a different search term' : 'Try a different status filter'
          }
          maxHeight="58vh"
          toolbar={{
            searchValue: search,
            onSearch: setSearch,
            searchPlaceholder: 'Search by name, company, location...',
            bulkActions:
              selected.size > 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEnrich}
                    disabled={enriching || busy || enrichableCount === 0}
                    title={
                      enrichableCount === 0
                        ? 'Everything selected is already enriched'
                        : undefined
                    }
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--ui-accent-tint)', color: 'var(--ui-accent)' }}
                  >
                    <Sparkles size={14} />
                    {resumeOnly ? 'Resume' : 'Enrich'} ({enrichableCount})
                  </button>
                  <button
                    onClick={handlePromote}
                    disabled={busy || enriching}
                    title={
                      unenrichedSelected > 0
                        ? `${unenrichedSelected} of these haven’t been enriched — they’ll move across with only their CSV fields.`
                        : undefined
                    }
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--ui-success-tint)', color: 'var(--ui-success)' }}
                  >
                    <ArrowRight size={14} />
                    Move to Contacts ({selected.size})
                  </button>
                  <button
                    onClick={openImportToHub}
                    disabled={busy || enriching}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--ui-accent-tint)', color: 'var(--ui-accent-fg)' }}
                  >
                    <Upload size={14} />
                    Import to Hub ({selected.size})
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={busy || enriching}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: 'var(--ui-danger)' }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ) : null,
          }}
          pagination={{
            page,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: setPage,
          }}
        />
      </div>

      {/* Warning when promoting rows that were never enriched */}
      {selected.size > 0 && unenrichedSelected > 0 && !enriching && (
        <p className="text-[var(--ui-t-label)] px-1" style={{ color: 'var(--ui-text-tertiary)' }}>
          {unenrichedSelected} selected lead{unenrichedSelected === 1 ? ' has' : 's have'} not been
          enriched. Moving {unenrichedSelected === 1 ? 'it' : 'them'} now carries across only the
          fields from your CSV.
        </p>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[var(--ui-z-modal)] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[var(--ui-radius-lg)] p-[var(--ui-pad-lg)] shadow-[var(--ui-shadow-lg)]"
            style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
          >
            <h3 className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
              Delete {selected.size} staged lead{selected.size === 1 ? '' : 's'}?
            </h3>
            <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-2">
              This removes them from staging only. Anyone already in your Contacts list stays
              there.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ImportToHubModal
        open={importModalOpen}
        onClose={closeImportToHub}
        seedCount={selectedIds.length}
        submitting={importingToHub}
        onSubmit={submitImportToHub}
      />
    </div>
  );
}
