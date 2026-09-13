import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import leadController from '../controller/lead.js';
import campaignController from 'src/products/hub/campaigns/controller/campaign.js';
import sequenceController from 'src/products/hub/sequences/controller/sequence.js';
import { isBusy } from './audience.js';
import { PAGE_SIZE, POLL_MS } from '../constants.js';

/**
 * All state and orchestration for the hub leads page — importing an
 * audience, the leads table, selection actions (create campaign / enroll in
 * a sequence), and the lead drawer. Moved out of the page component itself
 * so the page is UI only; every effect, poll, and error-toast path below is
 * unchanged from when it lived there.
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
  const [selectedLead, setSelectedLead] = useState(null);
  const [sequences, setSequences] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

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

  const loadSearches = useCallback((signal) => {
    const live = () => mountedRef.current && !signal?.aborted;
    return leadController.listSearches()
      .then((next) => { if (live()) setSearches(next); })
      .catch((err) => { if (live()) toast.error(getToastError(err, 'Could not load your audiences')); });
  }, [toast]);

  const loadLeads = useCallback((signal, { page = 1 } = {}) => {
    const live = () => mountedRef.current && !signal?.aborted;
    return leadController.listLeads({ searchId: activeSearchId, q: query, page, limit: PAGE_SIZE })
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

  // Sequences to enroll a selection into, from the picker in the table
  // toolbar. Loaded once — the list is short and this page already polls
  // elsewhere for things that actually change on their own; a sequence being
  // created/deleted mid-visit here is rare enough not to warrant a poll.
  useEffect(() => {
    sequenceController.listSequences()
      .then((next) => { if (mountedRef.current) setSequences(next); })
      .catch(() => {}); // silent: the picker just stays empty, not a page-breaking error
  }, []);

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
  const createAudience = async (payload) => {
    if (submitting) return;
    setSubmitting(true);
    setNeedsAccount(false);
    try {
      await leadController.createSearch(payload);
      toast.success('Queued. Importing starts within a minute.');
      await loadSearches();
    } catch (err) {
      // The one refusal worth handling rather than toasting: no usable
      // LinkedIn connection. A toast would vanish, and the fix is a different
      // page.
      const code = err?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(err, 'Could not queue that search'));
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const runSearch = async (search) => {
    try {
      await leadController.runSearch(search._id);
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
      await leadController.deleteSearch(search._id);
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
      const { campaign, enrolled } = await campaignController.createCampaign({
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
  const createMessageCampaign = async () => {
    if (selected.size === 0 || creating) return;
    setCreating(true);
    try {
      const { campaign, enrolled } = await campaignController.createCampaign({
        type: 'message',
        leadIds: [...selected],
      });
      if (!campaign?._id) throw new Error('Campaign was not created');
      toast.success(`${enrolled} lead(s) added. Write your message, then start it.`);
      navigate(`/hub/campaigns/${campaign._id}`);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') setNeedsAccount(true);
      else toast.error(getToastError(err, 'Could not create that campaign'));
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  /**
   * Enroll the current selection into an existing sequence, picked from the
   * toolbar select. Sequences themselves are built on their own page
   * (/hub/sequences/new) — a lead selection has nothing to configure, so this
   * is deliberately the same "instant action, land on the result" shape as
   * createCampaign above, just against a sequence someone already made.
   */
  const enrollInSequence = async (sequenceId) => {
    if (!sequenceId || selected.size === 0 || enrolling) return;
    setEnrolling(true);
    try {
      const { enrolled } = await sequenceController.enrollLeads(sequenceId, { leadIds: [...selected] });
      toast.success(`${enrolled} lead(s) enrolled. Nothing runs until the sequence is started.`);
      navigate(`/hub/sequences/${sequenceId}`);
    } catch (err) {
      toast.error(getToastError(err, 'Could not enroll those leads'));
    } finally {
      if (mountedRef.current) setEnrolling(false);
    }
  };

  /**
   * Folds a resolved profile back into the table row that's already on
   * screen, so reopening the drawer (or just glancing at the row) reflects
   * the enrichment without a full reload — same shape as PeoplePage's
   * handleNotesSaved.
   */
  const handleLeadResolved = useCallback((updated) => {
    if (!updated?._id) return;
    setLeads((prev) => prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)));
    setSelectedLead((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev));
  }, []);

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
  };
}
