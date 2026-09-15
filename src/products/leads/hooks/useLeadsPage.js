import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import leadController from '../controller/lead.js';
import campaignController from 'src/products/campaigns/controller/campaign.js';
import { CAMPAIGN_EVENTS } from 'src/products/campaigns/constants/constants.js';
import enrichmentCampaignController from 'src/products/enrichment/controller/campaign.js';
import { ENRICHMENT_EVENTS } from 'src/products/enrichment/constants/constants.js';
import sequenceController from 'src/products/sequences/controller/sequence.js';
import { SEQUENCE_EVENTS } from 'src/products/sequences/constants/constants.js';
import { isBusy } from './audience.js';
import { PAGE_SIZE, POLL_MS, LEAD_EVENTS } from '../constants/constants.js';

/**
 * All state and orchestration for the hub leads page — importing an
 * audience, the leads table, selection actions (create campaign / enroll in
 * a sequence), and the lead drawer. Moved out of the page component itself
 * so the page is UI only; every effect, poll, and error-toast path below is
 * unchanged from when it lived there.
 *
 * Every server call goes through a controller, which reports back over an
 * EventEmitter instead of returning a promise — this hook has no
 * async/await or try/catch of its own. Loaders that can overlap
 * (loadSearches/loadLeads/loadEnrichLeads race against typing and polling)
 * use a fresh, one-shot EventEmitter per call plus a "latest call wins"
 * token ref — the event-driven replacement for the AbortController this
 * hook used to carry, since none of these gateway calls ever actually
 * supported real request cancellation; the signal only ever gated which
 * response's setState calls survived.
 */
export function useLeadsPage() {
  const [searches, setSearches] = useState([]);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [creating, setCreating] = useState(false);
  const [creatingEnrichment, setCreatingEnrichment] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [sequences, setSequences] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  // ---- Enrich tab (HUB_CAPTURE_RESTRUCTURE_PLAN.md §11) ----
  // Its own list/pagination/loading, separate from the "All leads" state
  // above: this tab always shows every not-yet-enriched lead, server-side
  // filtered, regardless of whatever search/audience filter or page the
  // "All leads" tab currently has selected.
  const [activeTab, setActiveTab] = useState('all');
  const [enrichLeads, setEnrichLeads] = useState([]);
  const [enrichPagination, setEnrichPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [enrichLoading, setEnrichLoading] = useState(true);
  const [enrichQuery, setEnrichQuery] = useState('');
  // Separate Set from `selected` above on purpose: selecting rows to enrich
  // must not also leave them selected for "Create Campaign" (or vice versa)
  // when the user switches tabs.
  const [enrichSelected, setEnrichSelected] = useState(() => new Set());
  const [queuingEnrich, setQueuingEnrich] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  /**
   * Whether this component is still on screen. Every load below checks this
   * before writing state, same as it always did.
   */
  const mountedRef = useRef(true);
  /**
   * Set on every mount, not only cleared on unmount.
   *
   * StrictMode mounts, unmounts and remounts in development. A cleanup-only
   * version leaves this false for the life of the real mount, so every "am I
   * still on screen?" guard fails, every response is discarded, and the page
   * sits on its loading state over requests that plainly succeeded. It is
   * invisible in production, where the double invoke does not happen — which
   * is exactly what makes it worth a comment.
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadSearchesTokenRef = useRef(null);
  const loadSearches = useCallback(() => {
    const token = {};
    loadSearchesTokenRef.current = token;
    const callEmitter = new EventEmitter();
    callEmitter.once(LEAD_EVENTS.LIST_SEARCHES_SUCCESS, (next) => {
      if (!mountedRef.current || loadSearchesTokenRef.current !== token) return;
      setSearches(next);
    });
    callEmitter.once(LEAD_EVENTS.LIST_SEARCHES_FAILURE, (error) => {
      if (!mountedRef.current || loadSearchesTokenRef.current !== token) return;
      toast.error(getToastError(error, 'Could not load your audiences'));
    });
    leadController.listSearches(callEmitter);
  }, [toast]);

  const loadLeadsTokenRef = useRef(null);
  const loadLeads = useCallback(({ page = 1 } = {}) => {
    const token = {};
    loadLeadsTokenRef.current = token;
    const callEmitter = new EventEmitter();
    callEmitter.once(LEAD_EVENTS.LIST_LEADS_SUCCESS, (res) => {
      if (!mountedRef.current || loadLeadsTokenRef.current !== token) return;
      setLeads(res.leads ?? []);
      setPagination(res.pagination ?? { page, limit: PAGE_SIZE, total: 0 });
      setLoading(false);
    });
    callEmitter.once(LEAD_EVENTS.LIST_LEADS_FAILURE, (error) => {
      if (!mountedRef.current || loadLeadsTokenRef.current !== token) return;
      toast.error(getToastError(error, 'Could not load leads'));
      setLoading(false);
    });
    leadController.listLeads(callEmitter, { searchId: activeSearchId, q: query, page, limit: PAGE_SIZE });
  }, [activeSearchId, query, toast]);

  useEffect(() => {
    loadSearches();
  }, [loadSearches]);

  // Comma-separated allow-list the server's enrichmentStatus filter accepts —
  // everything short of 'enriched'. 'none' is the (rare, pre-backfill) state
  // for a lead created before the enrichmentStatus field existed.
  const NEEDS_ENRICHMENT_STATUSES = 'none,queued,enriching,failed';

  const loadEnrichLeadsTokenRef = useRef(null);
  const loadEnrichLeads = useCallback(({ page = 1 } = {}) => {
    const token = {};
    loadEnrichLeadsTokenRef.current = token;
    // No setEnrichLoading(true) here — same convention as loadLeads above:
    // `enrichLoading` starts true from useState and only ever goes false, in
    // the success/failure handler below. Setting it back to true on every
    // call (including from a synchronous effect body) is what trips
    // react-hooks/set-state-in-effect for no benefit — a poll tick or a
    // page change re-fetching in the background shouldn't flash the table
    // back to a loading state anyway.
    const callEmitter = new EventEmitter();
    callEmitter.once(LEAD_EVENTS.LIST_LEADS_SUCCESS, (res) => {
      if (!mountedRef.current || loadEnrichLeadsTokenRef.current !== token) return;
      setEnrichLeads(res.leads ?? []);
      setEnrichPagination(res.pagination ?? { page, limit: PAGE_SIZE, total: 0 });
      setEnrichLoading(false);
    });
    callEmitter.once(LEAD_EVENTS.LIST_LEADS_FAILURE, (error) => {
      if (!mountedRef.current || loadEnrichLeadsTokenRef.current !== token) return;
      toast.error(getToastError(error, 'Could not load leads'));
      setEnrichLoading(false);
    });
    leadController.listLeads(callEmitter, { enrichmentStatus: NEEDS_ENRICHMENT_STATUSES, q: enrichQuery, page, limit: PAGE_SIZE });
  }, [toast, enrichQuery]);

  // Same debounced-search shape as the "All leads" effect below (a zero
  // delay when the query is empty covers the initial load too — this is the
  // ONLY load-triggering effect for this tab, deliberately, same as
  // loadLeads' own single effect below it: a second "just load once on
  // mount" effect keyed on loadEnrichLeads would double-fetch every time
  // enrichQuery changes and gives this callback a new identity). Loaded
  // regardless of which tab is active — not gated on activeTab — so the tab
  // strip's own count badge is right before the user ever switches to it.
  useEffect(() => {
    const timer = setTimeout(() => loadEnrichLeads({ page: 1 }), enrichQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadEnrichLeads, enrichQuery]);

  // Sequences to enroll a selection into, from the picker in the table
  // toolbar. Loaded once — the list is short and this page already polls
  // elsewhere for things that actually change on their own; a sequence being
  // created/deleted mid-visit here is rare enough not to warrant a poll.
  useEffect(() => {
    const callEmitter = new EventEmitter();
    callEmitter.once(SEQUENCE_EVENTS.LIST_SEQUENCES_SUCCESS, (next) => {
      if (mountedRef.current) setSequences(next);
    });
    // Silent on failure: the picker just stays empty, not a page-breaking error.
    sequenceController.listSequences(callEmitter);
  }, []);

  useEffect(() => {
    // Debounced so typing in the search box is not one request per keystroke.
    const t = setTimeout(() => loadLeads({ page: 1 }), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadLeads, query]);

  /**
   * Poll only while something is actually importing, and stop when it settles.
   *
   * A permanent 5-second timer against a page most users leave open all day is
   * a cost with no reader; an import that finished has nothing left to report.
   */
  // Extended (HUB_CAPTURE_RESTRUCTURE_PLAN.md §11) beyond just audience
  // imports: also keep polling while any loaded lead — in either tab — is
  // 'queued' or 'enriching', so a bulk enrichment run updates both tabs live
  // and a freshly-resolved lead is already cached by the time the user opens
  // it from the sidebar (see LeadDrawer's resolveLeadProfile short-circuit).
  const anyBusy = useMemo(
    () =>
      searches.some(isBusy) ||
      leads.some((l) => ['queued', 'enriching'].includes(l.enrichmentStatus)) ||
      enrichLeads.some((l) => ['queued', 'enriching'].includes(l.enrichmentStatus)),
    [searches, leads, enrichLeads],
  );

  useEffect(() => {
    if (!anyBusy) return undefined;

    /**
     * The tick deliberately does not chain off one another the way the old
     * promise-based version did (`loadSearches().then(() => loadLeads(...))`)
     * — these are now fire-and-forget dispatches, and there was never a hard
     * ordering requirement between the two: each one lands the moment its
     * own response arrives, guarded by the same "latest call wins" token
     * every loader already carries. A poll tick that lands after the page
     * moved to a different search/query is simply the stale side of that
     * same guard — this is a short GET with nothing to cancel; `mountedRef`
     * and the token refs already stop it writing anything wrong.
     */
    pollRef.current = setInterval(() => {
      loadSearches();
      loadLeads({ page: pagination.page });
      loadEnrichLeads({ page: enrichPagination.page });
    }, POLL_MS);

    return () => clearInterval(pollRef.current);
  }, [anyBusy, loadSearches, loadLeads, pagination.page, loadEnrichLeads, enrichPagination.page]);

  /**
   * One path in, whichever way the audience was described.
   *
   * There used to be two near-identical handlers — `submit` for a pasted URL
   * and `submitStructured` for filters — differing only in the body they
   * POSTed and each carrying its own copy of the NO_LINKEDIN_ACCOUNT
   * handling. AudienceForm decides which shape it is producing and hands over
   * exactly one of `searchUrl` or `filters`; the endpoint has always accepted
   * either. Two copies of error handling is two places for it to drift.
   */
  const createAudience = useCallback((payload) => {
    if (submitting) return;
    setSubmitting(true);
    setNeedsAccount(false);
    const callEmitter = new EventEmitter();
    callEmitter.once(LEAD_EVENTS.CREATE_SEARCH_SUCCESS, () => {
      toast.success('Queued. Importing starts within a minute.');
      if (mountedRef.current) setSubmitting(false);
      loadSearches();
    });
    callEmitter.once(LEAD_EVENTS.CREATE_SEARCH_FAILURE, (error) => {
      // The one refusal worth handling rather than toasting: no usable
      // LinkedIn connection. A toast would vanish, and the fix is a different
      // page.
      const code = error?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(error, 'Could not queue that search'));
      if (mountedRef.current) setSubmitting(false);
    });
    leadController.createSearch(callEmitter, payload);
  }, [submitting, toast, loadSearches]);

  const runSearch = useCallback((search) => {
    const callEmitter = new EventEmitter();
    callEmitter.once(LEAD_EVENTS.RUN_SEARCH_SUCCESS, () => {
      toast.success(search.status === 'done' ? 'Checking for new people.' : 'Resuming where it stopped.');
      loadSearches();
    });
    callEmitter.once(LEAD_EVENTS.RUN_SEARCH_FAILURE, (error) => {
      toast.error(getToastError(error, 'Could not start that import'));
    });
    leadController.runSearch(callEmitter, search._id);
  }, [toast, loadSearches]);

  const deleteSearch = useCallback((search) => {
    confirm({
      title: 'Remove this audience?',
      // Says exactly what survives. "Are you sure?" would leave the user
      // guessing whether their leads go with it — they do not.
      body: `The ${search.importedCount?.toLocaleString() ?? 0} leads it imported stay in your list. Only the saved search is removed.`,
      confirmLabel: 'Remove',
    }).then((ok) => {
      if (!ok) return;
      const callEmitter = new EventEmitter();
      callEmitter.once(LEAD_EVENTS.DELETE_SEARCH_SUCCESS, () => {
        setActiveSearchId((prev) => (prev === search._id ? null : prev));
        loadSearches();
      });
      callEmitter.once(LEAD_EVENTS.DELETE_SEARCH_FAILURE, (error) => {
        toast.error(getToastError(error, 'Could not remove that audience'));
      });
      leadController.deleteSearch(callEmitter, search._id);
    });
  }, [confirm, toast, loadSearches]);

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
  const createCampaign = useCallback(() => {
    if (selected.size === 0 || creating) return;
    setCreating(true);
    const callEmitter = new EventEmitter();
    callEmitter.once(CAMPAIGN_EVENTS.CREATE_CAMPAIGN_SUCCESS, ({ campaign, enrolled }) => {
      if (!campaign?._id) {
        toast.error('Could not create that campaign');
        if (mountedRef.current) setCreating(false);
        return;
      }
      // Says what actually joined rather than what was selected — they differ
      // whenever a lead is already in that campaign.
      toast.success(`${enrolled} lead(s) added. Nothing sends until you start it.`);
      if (mountedRef.current) setCreating(false);
      navigate(`/hub/campaigns/${campaign._id}`);
    });
    callEmitter.once(CAMPAIGN_EVENTS.CREATE_CAMPAIGN_FAILURE, (error) => {
      const code = error?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(error, 'Could not create that campaign'));
      if (mountedRef.current) setCreating(false);
    });
    campaignController.createCampaign(callEmitter, { leadIds: [...selected] });
  }, [selected, creating, toast, navigate]);

  /**
   * Same one-click, no-dialog shape as createCampaign above, for a
   * `type: 'message'` campaign instead. No message text is asked for here —
   * exactly like a connect campaign never asks for its note upfront, the
   * server does not require one to create the campaign, only to start it.
   * The user lands on the campaign's page, writes the message there, then
   * presses Start. A message campaign is scoped to leads who are already
   * 1st-degree connections; anyone else in the selection is simply skipped
   * when the campaign runs (the detail page's member table says why, same as
   * every other skip reason).
   */
  const createMessageCampaign = useCallback(() => {
    if (selected.size === 0 || creating) return;
    setCreating(true);
    const callEmitter = new EventEmitter();
    callEmitter.once(CAMPAIGN_EVENTS.CREATE_CAMPAIGN_SUCCESS, ({ campaign, enrolled }) => {
      if (!campaign?._id) {
        toast.error('Could not create that campaign');
        if (mountedRef.current) setCreating(false);
        return;
      }
      toast.success(`${enrolled} lead(s) added. Write your message, then start it.`);
      if (mountedRef.current) setCreating(false);
      navigate(`/hub/campaigns/${campaign._id}`);
    });
    callEmitter.once(CAMPAIGN_EVENTS.CREATE_CAMPAIGN_FAILURE, (error) => {
      const code = error?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(error, 'Could not create that campaign'));
      if (mountedRef.current) setCreating(false);
    });
    campaignController.createCampaign(callEmitter, { type: 'message', leadIds: [...selected] });
  }, [selected, creating, toast, navigate]);

  /**
   * Create an enrichment campaign straight from the "All leads" selection —
   * same instant-action shape as createCampaign above, just for people whose
   * profile may already look complete on screen but haven't been resolved
   * through Unipile yet. Kept alongside (not instead of) the Enrich tab's own
   * bulk action below: that tab's selection (enrichSelected) is scoped to
   * leads the server has already flagged as needing it, while this one lets
   * you enrich ANY selection without switching tabs first.
   */
  const createEnrichmentCampaign = useCallback(() => {
    if (selected.size === 0 || creatingEnrichment) return;
    setCreatingEnrichment(true);
    const callEmitter = new EventEmitter();
    callEmitter.once(ENRICHMENT_EVENTS.CREATE_ENRICHMENT_CAMPAIGN_SUCCESS, ({ campaign, queued }) => {
      if (!campaign?._id) {
        toast.error('Could not create that enrichment campaign');
        if (mountedRef.current) setCreatingEnrichment(false);
        return;
      }
      toast.success(
        queued > 0
          ? `${queued} lead(s) queued for enrichment.`
          : 'Nothing to enrich — the selected leads are already enriched.',
      );
      if (mountedRef.current) setCreatingEnrichment(false);
      navigate(`/hub/enrichment/${campaign._id}`);
    });
    callEmitter.once(ENRICHMENT_EVENTS.CREATE_ENRICHMENT_CAMPAIGN_FAILURE, (error) => {
      const code = error?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(error, 'Could not create that enrichment campaign'));
      if (mountedRef.current) setCreatingEnrichment(false);
    });
    enrichmentCampaignController.createEnrichmentCampaign(callEmitter, { leadIds: [...selected] });
  }, [selected, creatingEnrichment, toast, navigate]);

  /**
   * Enroll the current selection into an existing sequence, picked from the
   * toolbar select. Sequences themselves are built on their own page
   * (/hub/sequences/new) — a lead selection has nothing to configure, so this
   * is deliberately the same "instant action, land on the result" shape as
   * createCampaign above, just against a sequence someone already made.
   */
  const enrollInSequence = useCallback((sequenceId) => {
    if (!sequenceId || selected.size === 0 || enrolling) return;
    setEnrolling(true);
    const callEmitter = new EventEmitter();
    callEmitter.once(SEQUENCE_EVENTS.ENROLL_LEADS_SUCCESS, ({ enrolled }) => {
      toast.success(`${enrolled} lead(s) enrolled. Nothing runs until the sequence is started.`);
      if (mountedRef.current) setEnrolling(false);
      navigate(`/hub/sequences/${sequenceId}`);
    });
    callEmitter.once(SEQUENCE_EVENTS.ENROLL_LEADS_FAILURE, (error) => {
      toast.error(getToastError(error, 'Could not enroll those leads'));
      if (mountedRef.current) setEnrolling(false);
    });
    sequenceController.enrollLeads(callEmitter, sequenceId, { leadIds: [...selected] });
  }, [selected, enrolling, toast, navigate]);

  /**
   * Folds a resolved profile back into the table row that's already on
   * screen, so reopening the drawer (or just glancing at the row) reflects
   * the enrichment without a full reload — same shape as PeoplePage's
   * handleNotesSaved.
   */
  const handleLeadResolved = useCallback((updated) => {
    if (!updated?._id) return;
    setLeads((prev) => prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)));
    setEnrichLeads((prev) => prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)));
    setSelectedLead((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev));
  }, []);

  /**
   * Create a named enrichment campaign from the Enrich tab's current
   * selection and land on its detail page — the same "instant action, land
   * on result" shape as createCampaign above, and the same
   * NO_LINKEDIN_ACCOUNT/LINKEDIN_ACCOUNT_NOT_READY handling as
   * createAudience/createCampaign: queuing an enrichment run costs a real
   * Unipile call per lead, so it fails at queue-time rather than stalling
   * silently in the worker.
   */
  const queueEnrichment = useCallback(() => {
    if (enrichSelected.size === 0 || queuingEnrich) return;
    const ids = [...enrichSelected];
    setQueuingEnrich(true);
    // Optimistic: mark them 'queued' locally in BOTH lists (a lead can be
    // showing on "All leads" too) so neither view waits on a round trip to
    // stop offering them, and so the anyBusy poll above has something to
    // key on immediately instead of waiting for the first tick.
    const markQueued = (list) =>
      list.map((l) => (ids.includes(l._id) ? { ...l, enrichmentStatus: 'queued' } : l));
    setLeads((prev) => markQueued(prev));
    setEnrichLeads((prev) => markQueued(prev));
    setEnrichSelected(new Set());
    const callEmitter = new EventEmitter();
    callEmitter.once(ENRICHMENT_EVENTS.CREATE_ENRICHMENT_CAMPAIGN_SUCCESS, ({ campaign, queued }) => {
      if (!campaign?._id) {
        toast.error('Could not create that enrichment campaign');
        if (mountedRef.current) setQueuingEnrich(false);
        return;
      }
      toast.success(
        queued > 0
          ? `${queued} lead(s) queued for enrichment.`
          : 'Nothing to enrich — the selected leads are already enriched.',
      );
      if (mountedRef.current) setQueuingEnrich(false);
      navigate(`/hub/enrichment/${campaign._id}`);
    });
    callEmitter.once(ENRICHMENT_EVENTS.CREATE_ENRICHMENT_CAMPAIGN_FAILURE, (error) => {
      const code = error?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(error, 'Could not create that enrichment campaign'));
      // No rollback of the optimistic status beyond that — the next poll
      // tick (anyBusy is already true, since these rows are 'queued' in
      // local state) corrects it from the server's real state either way.
      if (mountedRef.current) setQueuingEnrich(false);
    });
    enrichmentCampaignController.createEnrichmentCampaign(callEmitter, { leadIds: ids });
  }, [enrichSelected, queuingEnrich, navigate, toast]);

  /**
   * Whether the current selection is safe to message.
   *
   * The backend now rejects a `type: 'message'` enrollment outright if
   * anyone in it isn't already a 1st-degree connection (see
   * campaigns/service.js#enrollLeads) -- Sarthak's call was that a mixed
   * selection should never be allowed to become a message campaign at all,
   * not quietly skip the ones who aren't connected yet. This mirrors that
   * rule at the point of selection so the button itself says no, rather
   * than letting the click round-trip to the server for a rejection the
   * user could see coming from the Degree column.
   *
   * Leads not currently on this page (a prior search's results, if this
   * page ever supports cross-page selection) fall out of `leads` and are
   * simply not found here -- which correctly counts as "can't tell", not
   * "fine". Empty selection is never messageable; there is nothing to send.
   */
  const selectedAreAllFirstDegree = useMemo(() => {
    if (selected.size === 0) return false;
    const byId = new Map(leads.map((l) => [l._id, l]));
    return [...selected].every((id) => byId.get(id)?.connectionDegree === 1);
  }, [selected, leads]);

  const activeSearch = searches.find((s) => s._id === activeSearchId) ?? null;

  return {
    searches,
    leads,
    pagination,
    activeSearchId,
    setActiveSearchId,
    activeSearch,
    query,
    setQuery,
    loading,
    submitting,
    needsAccount,
    selected,
    setSelected,
    creating,
    creatingEnrichment,
    createEnrichmentCampaign,
    selectedLead,
    setSelectedLead,
    sequences,
    enrolling,
    loadLeads,
    createAudience,
    runSearch,
    deleteSearch,
    createCampaign,
    createMessageCampaign,
    selectedAreAllFirstDegree,
    enrollInSequence,
    handleLeadResolved,

    // Enrich tab
    activeTab,
    setActiveTab,
    enrichLeads,
    enrichPagination,
    enrichLoading,
    enrichQuery,
    setEnrichQuery,
    enrichSelected,
    setEnrichSelected,
    queuingEnrich,
    loadEnrichLeads,
    queueEnrichment,
  };
}
