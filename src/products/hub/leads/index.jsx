import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Play, Trash2, AlertTriangle, Linkedin, Send } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Input, Badge, useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { hubSourcingApi } from './api.js';
import { hubCampaignsApi } from 'src/products/hub/campaigns/api.js';
import { hubLeadColumns } from './columns.jsx';

/**
 * Hub leads — paste a LinkedIn search, get an audience.
 *
 * The page is built around one fact: importing takes minutes, not
 * milliseconds. Ten results per call against LinkedIn means a thousand leads is
 * about a hundred calls, so submitting a URL only queues an audience — a worker
 * pages it in the background and this page polls.
 *
 * Which is why progress here is a COUNT and never a bar. Classic search returns
 * no total, so the honest answer to "how far along is it?" is "412 so far", and
 * a progress bar would have to invent the denominator.
 */

const PAGE_SIZE = 50;
const POLL_MS = 5000;

const STATUS_VIEW = {
  queued: { label: 'Queued', tone: 'neutral', detail: 'Waiting for the importer. Starts within a minute.' },
  running: { label: 'Importing', tone: 'info', detail: 'Reading results from LinkedIn.' },
  done: { label: 'Imported', tone: 'success', detail: 'Everything LinkedIn returned is in.' },
  failed: { label: 'Failed', tone: 'danger', detail: 'Stopped before finishing.' },
};

const isBusy = (s) => s?.status === 'queued' || s?.status === 'running';

/** A saved audience, its progress, and the two things you can do to it. */
function SearchRow({ search, active, onSelect, onRun, onDelete, busy }) {
  const view = STATUS_VIEW[search.status] ?? STATUS_VIEW.queued;

  return (
    <div
      className={[
        'flex items-center gap-3 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--separator)] last:border-b-0',
        active ? 'bg-[var(--ui-accent-tint)]' : '',
      ].join(' ')}
    >
      {/* A whole-row toggle rather than a control: it spans the row so the
          filter target is the thing you are looking at. Kept as a button, not a
          div with onClick, because it must stay keyboard-reachable. */}
      {/* eslint-disable-next-line no-restricted-syntax */}
      <button
        type="button"
        onClick={() => onSelect(active ? null : search._id)}
        className="flex-1 min-w-0 text-left focus:outline-none focus-visible:underline"
        aria-pressed={active}
      >
        <span className="block text-[13px] text-[var(--text-primary)] truncate">
          {search.name || 'Untitled audience'}
        </span>
        <span className="block text-[11px] text-[var(--text-tertiary)] truncate">{search.searchUrl}</span>
      </button>

      <span className="text-[12px] tabular-nums text-[var(--text-secondary)] shrink-0">
        {search.importedCount?.toLocaleString() ?? 0} imported
      </span>

      <Badge tone={view.tone} title={view.detail}>
        <span className="inline-flex items-center gap-1">
          {isBusy(search) && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
          {view.label}
        </span>
      </Badge>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || isBusy(search)}
          onClick={() => onRun(search)}
          title={search.status === 'done' ? 'Check for people who have appeared since' : 'Resume this import'}
        >
          <Play size={13} />
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDelete(search)} title="Remove this audience">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Shown when an import stopped early rather than running out of people.
 *
 * The backend can tell the two apart — an empty page that still carries a
 * cursor is LinkedIn declining, not an exhausted audience — and saying
 * "imported 240" without this would be a number the user plans around.
 */
function StoppedShortNotice({ search }) {
  if (!search?.error) return null;
  return (
    <div className="flex items-start gap-2 px-[var(--ui-pad-lg)] py-3 bg-[var(--amber-tint)] border-b border-[var(--separator)]">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--amber)' }} aria-hidden="true" />
      <p className="text-[12px] text-[var(--text-secondary)]">{search.error}</p>
    </div>
  );
}

export function HubLeadsPage() {
  const [searches, setSearches] = useState([]);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [query, setQuery] = useState('');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [creating, setCreating] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  /**
   * Whether this component is still on screen.
   *
   * The load functions used to guard their setState purely on an AbortSignal,
   * which conflated two different questions: "did we navigate away?" and "did
   * this effect re-run?". See the polling effect below for what that cost.
   */
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const loadSearches = useCallback((signal) => {
    const live = () => mountedRef.current && !signal?.aborted;
    return hubSourcingApi.listSearches()
      .then((next) => { if (live()) setSearches(next); })
      .catch((err) => { if (live()) toast.error(getToastError(err, 'Could not load your audiences')); });
  }, [toast]);

  const loadLeads = useCallback((signal, { page = 1 } = {}) => {
    const live = () => mountedRef.current && !signal?.aborted;
    return hubSourcingApi.listLeads({ searchId: activeSearchId, q: query, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!live()) return;
        setLeads(res.leads ?? []);
        setPagination(res.pagination ?? { page, limit: PAGE_SIZE, total: 0 });
      })
      .catch((err) => { if (live()) toast.error(getToastError(err, 'Could not load leads')); })
      .finally(() => { if (live()) setLoading(false); });
  }, [activeSearchId, query, toast]);

  useEffect(() => {
    const controller = new AbortController();
    loadSearches(controller.signal);
    return () => controller.abort();
  }, [loadSearches]);

  useEffect(() => {
    const controller = new AbortController();
    // Debounced so typing in the search box is not one request per keystroke.
    const t = setTimeout(() => loadLeads(controller.signal, { page: 1 }), query ? 300 : 0);
    return () => { clearTimeout(t); controller.abort(); };
  }, [loadLeads, query]);

  /**
   * Poll only while something is actually importing, and stop when it settles.
   *
   * A permanent 5-second timer against a page most users leave open all day is
   * a cost with no reader; an import that finished has nothing left to report.
   */
  const anyBusy = useMemo(() => searches.some(isBusy), [searches]);

  useEffect(() => {
    if (!anyBusy) return undefined;

    /**
     * The tick deliberately carries NO abort signal.
     *
     * It used to share one controller with this effect, aborted on cleanup —
     * and the effect's cleanup runs the instant `anyBusy` flips false, which is
     * the moment the searches poll reports the import finished. So the very
     * fetch that would have filled the table was discarded, every time, and the
     * page sat on "No leads yet" over an import that had plainly succeeded
     * until the user reloaded. Observed in production, first run.
     *
     * A poll tick is a short GET with nothing to cancel; `mountedRef` already
     * stops it writing to a component that has gone away.
     */
    pollRef.current = setInterval(() => {
      loadSearches().then(() => loadLeads(undefined, { page: pagination.page }));
    }, POLL_MS);

    return () => clearInterval(pollRef.current);
  }, [anyBusy, loadSearches, loadLeads, pagination.page]);

  const submit = async (e) => {
    e.preventDefault();
    if (!url.trim() || submitting) return;

    setSubmitting(true);
    setNeedsAccount(false);
    try {
      await hubSourcingApi.createSearch({ searchUrl: url.trim(), name: name.trim() });
      setUrl('');
      setName('');
      toast.success('Queued. Importing starts within a minute.');
      await loadSearches();
    } catch (err) {
      // The one refusal worth handling rather than toasting: no usable LinkedIn
      // connection. A toast would vanish, and the fix is a different page.
      const code = err?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(err, 'Could not queue that search'));
    } finally {
      setSubmitting(false);
    }
  };

  const runSearch = async (search) => {
    try {
      await hubSourcingApi.runSearch(search._id);
      toast.success(search.status === 'done' ? 'Checking for new people.' : 'Resuming where it stopped.');
      await loadSearches();
    } catch (err) {
      toast.error(getToastError(err, 'Could not start that import'));
    }
  };

  const deleteSearch = async (search) => {
    const ok = await confirm({
      title: 'Remove this audience?',
      // Says exactly what survives. "Are you sure?" would leave the user
      // guessing whether their leads go with it — they do not.
      body: `The ${search.importedCount?.toLocaleString() ?? 0} leads it imported stay in your list. Only the saved search is removed.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;

    try {
      await hubSourcingApi.deleteSearch(search._id);
      if (activeSearchId === search._id) setActiveSearchId(null);
      await loadSearches();
    } catch (err) {
      toast.error(getToastError(err, 'Could not remove that audience'));
    }
  };

  /**
   * Selection to campaign in one click, no dialog.
   *
   * The server names the campaign and enrols the selection; the user lands on
   * its page where the name, the note and the start button all are. A modal
   * asking for a name first would put a form between the decision that matters
   * — these people — and seeing what happens to them, and the same call was
   * already made for the extension's campaigns.
   *
   * Nothing is sent by this. The campaign starts as a draft, which is why this
   * button can be a single click at all.
   */
  const createCampaign = async () => {
    if (selected.size === 0 || creating) return;
    setCreating(true);
    try {
      const { campaign, enrolled } = await hubCampaignsApi.createCampaign({
        leadIds: [...selected],
      });
      if (!campaign?._id) throw new Error('Campaign was not created');
      // Says what actually joined rather than what was selected — they differ
      // whenever a lead is already in that campaign.
      toast.success(`${enrolled} lead(s) added. Nothing sends until you start it.`);
      navigate(`/hub/campaigns/${campaign._id}`);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(err, 'Could not create that campaign'));
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  const activeSearch = searches.find((s) => s._id === activeSearchId) ?? null;

  return (
    <DashboardLayout
      title="Leads"
      subtitle="Paste a LinkedIn search and Spurly builds the audience for you."
    >
      <div className="flex flex-col gap-4">
        <SectionCard title="Import a search">
          {needsAccount ? (
            <div className="px-[var(--ui-pad-lg)] py-5 flex items-start gap-3">
              <Linkedin size={16} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
              <div>
                <p className="text-[13px] text-[var(--text-primary)]">
                  Connect your LinkedIn account before importing.
                </p>
                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                  Searches run through your own account, so there is nothing to read results with until it is linked.
                </p>
                <Link
                  to="/dashboard/settings/linkedin"
                  className="inline-block mt-2 text-[13px] font-medium text-[var(--ui-accent-fg)] hover:underline"
                >
                  Go to LinkedIn settings
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="px-[var(--ui-pad-lg)] py-4 flex flex-col gap-3">
              <Input
                fullWidth
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.linkedin.com/search/results/people/?keywords=…"
                aria-label="LinkedIn search URL"
              />
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name this audience (optional)"
                  aria-label="Audience name"
                />
                <Button type="submit" disabled={!url.trim() || submitting}>
                  {submitting ? 'Queueing…' : 'Import'}
                </Button>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Run the search on LinkedIn, then paste the results URL. Importing happens in the
                background — you can leave this page.
              </p>
            </form>
          )}
        </SectionCard>

        {searches.length > 0 && (
          <SectionCard title="Audiences" noPadding>
            <StoppedShortNotice search={activeSearch} />
            {searches.map((search) => (
              <SearchRow
                key={search._id}
                search={search}
                active={search._id === activeSearchId}
                onSelect={setActiveSearchId}
                onRun={runSearch}
                onDelete={deleteSearch}
                busy={submitting}
              />
            ))}
          </SectionCard>
        )}

        <DataTable
          columns={hubLeadColumns}
          data={leads}
          loading={loading}
          emptyMessage={activeSearchId ? 'No leads from this audience yet' : 'No leads yet'}
          emptyHint={
            searches.length === 0
              ? 'Paste a LinkedIn search above to build your first audience.'
              : 'Imports run in the background — this fills in as pages come back.'
          }
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          toolbar={{
            searchValue: query,
            onSearch: setQuery,
            searchPlaceholder: 'Search name, headline, company',
            bulkActions: (
              <Button
                size="sm"
                variant="primary"
                leadingIcon={<Send size={13} />}
                onClick={createCampaign}
                loading={creating}
                disabled={creating || selected.size === 0}
              >
                Create campaign
              </Button>
            ),
          }}
          pagination={{
            page: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: (page) => loadLeads(undefined, { page }),
          }}
        />
      </div>
    </DashboardLayout>
  );
}
