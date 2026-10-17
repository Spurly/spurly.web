import { useState, useMemo, useEffect } from 'react';
import { ArrowRight, Trash2, AlertCircle, X, UploadCloud, RotateCcw } from 'lucide-react';
import { DataTable } from 'src/core/DataTable';
import { Button, Dropdown, Input, useToast } from 'src/core/primitives';
import { IMPORT_EVENTS } from 'src/products/import/constants/constants.js';
import { stagingColumns } from './stagingColumns.jsx';

/**
 * Preview only — mirrors the backend's own default-name format
 * (defaultAudienceName in products/hub/importedLeads/service.js) so the
 * placeholder shown here never drifts from what actually gets saved when
 * the user leaves the field blank. Built by hand rather than via
 * Intl.DateTimeFormat for the same reason as the backend: en-GB's own short
 * month for September is "Sept", not "Sep".
 */
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function defaultAudienceNamePreview() {
  const now = new Date();
  return `Import - ${now.getDate()} ${SHORT_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Every status a staged lead can be in needs a chip. Omitting one produces the
 * worst possible reading: "All 12" beside a row of zeros, which looks like the
 * page is broken rather than like a status simply isn't represented.
 * `queued` folds in `enriching` — mid-run is a kind of waiting, and splitting
 * them would give the user a chip that's empty almost always.
 */
const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Not sent' },
  { id: 'queued', label: 'Sending' },
  { id: 'enriched', label: 'Enriched' },
  { id: 'failed', label: 'Failed' },
];

/**
 * The staging table: everything imported but not yet sent to the Hub —
 * whether it arrived via a CSV or the extension's "Push to Spurly" (see the
 * Origin column).
 *
 * 2026-09-18: "Send to Hub" queues the selection for import instead of
 * writing it there directly — each lead is resolved through LinkedIn
 * (Unipile) first, the same "Import to Hub" pipeline this page used to have
 * as a separate, now-removed button. A row leaves this table on its own,
 * server-side, the moment it's actually resolved (the hook polls while
 * anything is 'queued' — see useImportedLeads.js); one that fails to
 * resolve becomes 'failed' and stays here for the user to Retry or Delete.
 *
 * `promoteSelected`/`deleteSelected`/`retrySelected` fire the controller and
 * let `store`'s own hook update the table; this panel only needs to know the
 * outcome to clear the selection and show a toast, so it listens for that on
 * `store.eventEmitter` with `.once()` instead of awaiting anything itself.
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
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    busy,
    eventEmitter,
    promoteSelected,
    deleteSelected,
    retrySelected,
  } = store;

  const toast = useToast();
  const [selected, setSelected] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [audienceName, setAudienceName] = useState('');

  /* The block below is the real home for this: it's long and instructional
     and stays relevant until acted on. The toast is only a pointer to it —
     fixed copy, no detail — so a paragraph of detail never ends up in a
     4-second notification. */
  useEffect(() => {
    if (actionError) toast.error("Couldn't complete that action", { description: 'See the note above the table.' });
  }, [actionError, toast]);

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

  // Only pending/failed rows are actually eligible to be (re-)sent — a
  // 'queued' one is already being resolved. Selecting a mix is harmless (the
  // server just skips what it can't act on and reports the skip count), but
  // this drives the Retry button's visibility.
  const failedSelected = selectedRows.filter((r) => r.enrichStatus === 'failed').length;

  const clearSelection = () => setSelected(new Set());

  // "Send to Hub" opens the naming step rather than sending immediately —
  // every batch lands under a Hub audience now, so the user gets one chance
  // to name it before it's created.
  const openPromoteConfirm = () => {
    if (selectedIds.length === 0) return;
    setAudienceName('');
    setConfirmPromote(true);
  };

  const handlePromote = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const name = audienceName.trim();
    eventEmitter.once(IMPORT_EVENTS.PROMOTE_SUCCESS, ({ queued, audience } = {}) => {
      clearSelection();
      setConfirmPromote(false);
      const audienceLabel = audience?.name ? ` into "${audience.name}"` : '';
      toast.success(`Sending ${(queued || count).toLocaleString()} to Hub${audienceLabel} — resolving now`);
    });
    promoteSelected(selectedIds, name || undefined);
  };

  const handleRetry = () => {
    if (selectedIds.length === 0) return;
    eventEmitter.once(IMPORT_EVENTS.RETRY_SUCCESS, ({ reset } = {}) => {
      clearSelection();
      toast.success(`${(reset || 0).toLocaleString()} lead${reset === 1 ? '' : 's'} ready to resend`);
    });
    retrySelected(selectedIds);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    eventEmitter.once(IMPORT_EVENTS.DELETE_SUCCESS, ({ deleted } = {}) => {
      clearSelection();
      toast.success(`Deleted ${(deleted || count).toLocaleString()} staged leads`);
    });
    deleteSelected(selectedIds);
    setConfirmDelete(false);
  };

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
          <h2 className="text-[length:var(--ui-t-section)] font-medium text-[var(--ui-text-primary)] tracking-[-0.012em]">
            Nothing staged yet
          </h2>
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1.5 max-w-md">
            Import a CSV and the leads will land here, ready to send to your Hub leads.
          </p>
        </div>
        <Button variant="primary" onClick={onGoToUpload} trailingIcon={<ArrowRight size={16} />}>
          Import a CSV
        </Button>
      </div>
    );
  }

  /* One strip above the rows, like Leads' working line: a failed action wins,
     otherwise the expectation note while a selection exists. */
  const banner = actionError ? (
    <div className="relative flex items-center gap-3 px-4 py-2.5 bg-[var(--ui-danger-tint)] border-b border-[var(--ui-border)]">
      <AlertCircle size={16} className="shrink-0" style={{ color: 'var(--ui-danger)' }} />
      <p className="flex-1 text-[length:var(--ui-t-label)] pr-6 text-[var(--ui-text-secondary)]">{actionError}</p>
      <button
        type="button"
        onClick={clearActionError}
        aria-label="Dismiss"
        className="absolute top-1/2 -translate-y-1/2 right-2.5 w-6 h-6 grid place-items-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-hover)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  ) : selected.size > 0 ? (
    <p className="px-4 py-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] bg-[var(--ui-accent-tint)] border-b border-[var(--ui-border)]">
      Sending resolves each profile through LinkedIn before it lands in Hub. Rows leave this table as they land, and anything that can’t be resolved shows as Failed, ready to retry.
    </p>
  ) : null;

  const statusFilterControl = (
    <Dropdown
      variant="dashboard"
      size="sm"
      value={statusFilter}
      onChange={setStatusFilter}
      ariaLabel="Filter by status"
      options={STATUS_FILTERS.map((f) => [
        f.id,
        `${f.label} · ${f.id === 'all' ? stats.total : stats.byStatus?.[f.id] ?? 0}`,
      ])}
    />
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DataTable
        className="flex-1"
        columns={stagingColumns}
        data={leads}
        rowKey={(row) => row._id}
        loading={loading}
        error={error}
        banner={banner}
        selectable
        reorderable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        emptyMessage={search ? 'No staged leads match your search' : 'No leads in this status'}
        emptyHint={search ? 'Try a different search term' : 'Try a different status filter'}
        toolbar={{
          searchValue: search,
          onSearch: setSearch,
          searchPlaceholder: 'Search by name, company, location...',
          filters: statusFilterControl,
          bulkActions:
            selected.size > 0 ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  leadingIcon={<ArrowRight size={13} />}
                  onClick={openPromoteConfirm}
                  disabled={busy}
                >
                  Send to Hub ({selected.size})
                </Button>
                {failedSelected > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leadingIcon={<RotateCcw size={13} />}
                    onClick={handleRetry}
                    disabled={busy}
                    title={`Reset ${failedSelected} failed lead${failedSelected === 1 ? '' : 's'} to try sending again`}
                  >
                    Retry ({failedSelected})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="dangerSoft"
                  leadingIcon={<Trash2 size={13} />}
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  Delete
                </Button>
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

      {/* Promote confirmation — names the Hub audience this batch lands in */}
      {confirmPromote && (
        <div
          className="fixed inset-0 z-[var(--ui-z-modal)] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmPromote(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[var(--ui-radius-lg)] p-[var(--ui-pad-lg)] shadow-[var(--ui-shadow-lg)]"
            style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
          >
            <h3 className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
              Send {selected.size} lead{selected.size === 1 ? '' : 's'} to Hub
            </h3>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-2">
              We'll resolve each profile through LinkedIn first, then land them in Hub under one
              audience so you can find this batch again later.
            </p>
            <label
              className="block text-[length:var(--ui-t-label)] font-medium mt-4 mb-1.5"
              style={{ color: 'var(--ui-text-secondary)' }}
              htmlFor="promote-audience-name"
            >
              Audience name (optional)
            </label>
            <Input
              id="promote-audience-name"
              fullWidth
              value={audienceName}
              onChange={(e) => setAudienceName(e.target.value)}
              placeholder={defaultAudienceNamePreview()}
              maxLength={200}
              autoFocus
            />
            <p className="text-[length:var(--ui-t-label)] mt-1.5" style={{ color: 'var(--ui-text-tertiary)' }}>
              Leave blank and it's named automatically, like the placeholder above.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={() => setConfirmPromote(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePromote} disabled={busy}>
                {busy ? 'Sending…' : 'Send to Hub'}
              </Button>
            </div>
          </div>
        </div>
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
            <h3 className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
              Delete {selected.size} staged lead{selected.size === 1 ? '' : 's'}?
            </h3>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-2">
              This removes them from staging only. Anyone already sent to your Hub leads stays
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

    </div>
  );
}
