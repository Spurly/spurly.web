import { useState, useEffect, useRef } from "react";
import { RefreshCw, AlertTriangle, X, Download, MessageSquare } from "lucide-react";
import { Button, IconButton, useToast } from "src/ui/primitives";
import { getToastError } from "src/common/utils/apiError";
import { DashboardLayout } from "src/components/DashboardLayout";
import { DataTable } from "src/components/DataTable";
import { LeadDetailSidebar } from "src/components/LeadDetailSidebar";
import { CreateMessageCampaignModal } from "./components/CreateMessageCampaignModal.jsx";
import { useConnections } from "src/hooks/useConnections";
import { useConnectionsSync } from "src/hooks/useConnectionsSync";
import connectionsController from "src/core/controllers/connectionsController";
import { exportProfilesAsCSV } from "src/common/utils/csvExport";
import { connectionColumns } from "./columns.jsx";
import { describeSyncResult } from "./helpers.js";

/**
 * Failure strip for a manual sync.
 *
 * FAILURES ONLY. A successful sync is confirmed by the toast and nothing else —
 * rendering the same sentence twice, once floating and once pinned above the
 * table, made a quiet success look like two separate events.
 *
 * Failures keep the strip because sync errors are frequently instructions
 * rather than statements — "LinkedIn's connections page isn't sorted by
 * recently added, set the sort back and sync again" is a task, and a task that
 * auto-dismisses after seven seconds is one the user can't act on.
 */
function SyncFailure({ result, onDismiss }) {
  if (!result || result.ok) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-2 shrink-0 border-b border-[var(--ui-border-hairline)]"
      style={{
        height: 'var(--ui-band)',
        paddingInline: 'var(--ui-pad-x)',
        background: 'var(--ui-danger-tint)',
      }}
    >
      <AlertTriangle size={13} style={{ color: "var(--ui-danger-fg)" }} aria-hidden="true" />
      <span className="text-[12px] font-medium" style={{ color: "var(--ui-danger-fg)" }}>
        {result.error}
      </span>
      <span className="flex-1" />
      <IconButton size="sm" variant="ghost" label="Dismiss" icon={<X size={13} />} onClick={onDismiss} />
    </div>
  );
}

/**
 * Connections — the user's own LinkedIn network.
 *
 * Populated by ticking rows on linkedin.com/mynetwork/invite-connect/connections
 * in the extension; those captures are routed to a separate backend collection
 * from People (see spurly.backend/src/features/connections).
 *
 * Intentionally simpler than the People page: no outreach status chips, no
 * campaign creation, no send budget. These are people you already know, not
 * leads in a pipeline — the page exists to answer "who is in my network",
 * so the only interactions are search, sort and export.
 */
export function ConnectionsPage() {
  const toast = useToast();
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  // `key: null` means "no column sort" — the list falls back to the server's
  // default (newest captured first).
  const [sort, setSort] = useState({ key: null, direction: null });

  const {
    connections,
    loading,
    error,
    pagination,
    fetchConnections,
    goToPage,
    setPageSize,
    currentPage,
    refresh,
  } = useConnections();

  // Manual trigger for the sweep the extension normally runs daily. On success
  // the table is refetched: degrees may have changed and the sweep also tops up
  // the roster, so the rows on screen are stale the moment it finishes.
  const {
    sync,
    running: syncing,
    result: syncResult,
    dismissResult,
  } = useConnectionsSync({ onComplete: refresh });

  /* A sweep takes minutes and finishes whenever it finishes — often long after
     the user has stopped watching the button. The strip alone assumes they're
     still looking at this page, so the outcome also gets a toast.
     Keyed on the result object, which the hook only replaces per completed run
     (it timestamps them), so a re-render can't fire this twice. */
  useEffect(() => {
    if (!syncResult) return;
    if (syncResult.ok) {
      toast.success('Connections synced', { description: describeSyncResult(syncResult) });
    } else {
      toast.error(getToastError(syncResult.error, "Couldn't sync your connections"));
    }
  }, [syncResult, toast]);

  /* Acknowledge the press itself. The button's spinner only helps while the
     user is looking at it, and this sweep opens a LinkedIn tab and reads a long
     list — telling them they can walk away is the useful part. */
  const handleSync = () => {
    if (syncing) return;
    toast.info('Syncing your connections', {
      description: 'This takes a minute. You can leave this page.',
    });
    sync();
  };

  // Refs so the debounced search effect can read the current sort and page
  // size without re-triggering itself.
  const pageLimitRef = useRef(pagination.limit);
  const sortRef = useRef(sort);
  useEffect(() => {
    sortRef.current = sort;
  }, [sort]);
  useEffect(() => {
    pageLimitRef.current = pagination.limit;
  }, [pagination.limit]);

  const buildFetchOptions = (overrides = {}) => {
    const search = overrides.search ?? searchQuery;
    const activeSort = overrides.sort ?? sortRef.current;

    const opts = {
      limit: overrides.limit ?? pageLimitRef.current,
      skip: overrides.skip ?? 0,
    };
    if (search && search.trim()) opts.search = search.trim();
    // Sorting is server-side: the table only holds one page, so ordering it
    // client-side would sort the visible rows out of the full set and look wrong.
    if (activeSort?.key && activeSort?.direction) {
      opts.sortBy = activeSort.key;
      opts.sortDir = activeSort.direction;
    }
    return opts;
  };

  // Debounced server-side search — fires 350ms after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      const opts = { limit: pageLimitRef.current, skip: 0 };
      if (searchQuery.trim()) opts.search = searchQuery.trim();
      const activeSort = sortRef.current;
      if (activeSort?.key && activeSort?.direction) {
        opts.sortBy = activeSort.key;
        opts.sortDir = activeSort.direction;
      }
      fetchConnections(opts);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchConnections]);

  // A third click on the same header clears the sort (direction: null), which
  // drops back to the server default of newest-captured-first.
  const handleSortChange = (next) => {
    setSort(next);
    setSelectedRows(new Set());
    fetchConnections(buildFetchOptions({ sort: next, limit: pagination.limit }));
  };

  // With a selection: export just those rows (no extra fetch needed).
  // With no selection: export everything matching the current search, not just
  // the current page — `connections` in state only holds one page, so re-fetch
  // the full filtered set in one shot first.
  const handleExport = async () => {
    if (selectedRows.size > 0) {
      const rows = connections
        .filter((c) => selectedRows.has(c._id))
        .map((c) => c.raw ?? c);
      const date = new Date().toISOString().split("T")[0];
      exportProfilesAsCSV(rows, `connections-${date}.csv`);
      toast.success(`Exported ${rows.length.toLocaleString()} selected`);
      return;
    }

    if (pagination.total === 0) return;

    setIsExporting(true);
    try {
      const opts = buildFetchOptions({ limit: pagination.total, skip: 0 });
      const { connections: all } = await connectionsController.getConnections(opts);
      const rows = all.map((c) => c.raw ?? c);
      const date = new Date().toISOString().split("T")[0];
      exportProfilesAsCSV(rows, `connections-${date}.csv`);
      toast.success(`Exported ${rows.length.toLocaleString()} connections`);
    } catch (e) {
      console.error("[Connections] Export error:", e);
      toast.error(getToastError(e, "Couldn't export your connections"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout
      title="Connections"
      subtitle={`${(pagination.total || 0).toLocaleString()} in your network`}
    >
      <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
        <SyncFailure result={syncResult} onDismiss={dismissResult} />

        <DataTable
            columns={connectionColumns}
            data={connections}
            rowKey={(row) => row._id}
            loading={loading}
            error={error}
            selectable
            selectedKeys={selectedRows}
            onSelectionChange={setSelectedRows}
            onRowClick={setSelectedConnection}
            sort={sort}
            onSortChange={handleSortChange}
            emptyMessage={
              searchQuery ? "No connections match your search" : "No connections captured yet"
            }
            emptyHint={
              searchQuery
                ? "Try a different search term"
                : "Open your LinkedIn connections page with the Spurly extension and tick the people you want to save"
            }
            toolbar={{
              searchValue: searchQuery,
              onSearch: setSearchQuery,
              searchPlaceholder: "Search name, company, location",
              actions: (
                <>
                  {/* Spurly checks LinkedIn once a day on its own. This is the
                      escape hatch for when that hasn't happened — browser was
                      closed, a campaign was mid-send, LinkedIn asked for a
                      checkpoint. Runs in the extension, not here. */}
                  {/* Connections are 1st-degree by definition, which makes them
                      the right source for a MESSAGE campaign — the one action
                      that only works on people you're already connected to. */}
                  {selectedRows.size > 0 && (
                    <Button
                      size="sm"
                      leadingIcon={<MessageSquare size={13} />}
                      onClick={() => setCreatingCampaign(true)}
                    >
                      Message {selectedRows.size}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    leadingIcon={
                      <RefreshCw size={13} className={syncing ? "animate-spin" : undefined} />
                    }
                    onClick={handleSync}
                    disabled={syncing}
                    title="Read LinkedIn for connections added since the last sync"
                  >
                    {syncing ? "Syncing…" : "Sync now"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Download size={13} />}
                    onClick={handleExport}
                    loading={isExporting}
                    disabled={selectedRows.size === 0 && pagination.total === 0}
                  >
                    {selectedRows.size > 0 ? `Export ${selectedRows.size}` : "Export"}
                  </Button>
                </>
              ),
            }}
            pagination={{
              page: currentPage,
              pageSize: pagination.limit,
              total: pagination.total,
              onPageChange: goToPage,
              onPageSizeChange: setPageSize,
            }}
          />

        {/* Detail drawer (overlay) — same component the People table uses, with
            outreach suppressed. A connection has no outreach state, and the
            timeline resolves personId against the People collection, so passing
            a Connection id would 404. */}
        {creatingCampaign && (
          <CreateMessageCampaignModal
            connectionIds={[...selectedRows]}
            onClose={() => setCreatingCampaign(false)}
            onSuccess={() => setSelectedRows(new Set())}
          />
        )}

        {selectedConnection && (
          <LeadDetailSidebar
            lead={selectedConnection}
            onClose={() => setSelectedConnection(null)}
            showOutreach={false}
            heading="Connection"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
