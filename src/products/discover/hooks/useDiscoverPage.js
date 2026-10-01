import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubDiscoverController from '../controller/discover.js';
import { DISCOVER_EVENTS, DISCOVER_TABS, DATE_POSTED_OPTIONS } from '../constants/constants.js';
import { discoverFailureKind, serverMessage } from '../format.js';

const emptyTab = () => ({
  items: [],
  cursor: null,
  total: null,
  loading: false,
  searched: false,
  error: null, // { kind, message }
  query: null, // what the shown results were searched with
});

const initialTabs = () => Object.fromEntries(DISCOVER_TABS.map((t) => [t.id, emptyTab()]));

/**
 * State for the Discover page: three independent tabs (companies, jobs,
 * posts), each with its own query, results, cursor and error, plus today's
 * search-page usage and the posts "import authors" action. Nothing loads on
 * arrival except the usage figure: a search spends vendor quota, so it only
 * runs when the person presses Search or Load more.
 */
export function useDiscoverPage() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const toast = useToast();

  const [tab, setTab] = useState(DISCOVER_TABS[0].id);
  const [tabs, setTabs] = useState(initialTabs);
  const [usage, setUsage] = useState(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(null); // { audience, imported, alreadyHad, skipped }
  const seqRef = useRef({});

  const patchTab = useCallback((id, patch) => {
    setTabs((prev) => ({ ...prev, [id]: { ...prev[id], ...(typeof patch === 'function' ? patch(prev[id]) : patch) } }));
  }, []);

  useEffect(() => {
    function onSearch({ ctx, data }) {
      if (seqRef.current[ctx.category] !== ctx.seq) return; // a newer search replaced this one
      patchTab(ctx.category, (t) => ({
        items: ctx.append ? [...t.items, ...(data[ctx.category] ?? [])] : (data[ctx.category] ?? []),
        cursor: data.cursor,
        total: data.total,
        loading: false,
        searched: true,
        error: null,
      }));
      if (data.usage) setUsage(data.usage);
    }
    function onSearchFailure({ ctx, error }) {
      if (seqRef.current[ctx.category] !== ctx.seq) return;
      const kind = discoverFailureKind(error);
      const message = kind === 'input' || kind === 'capped' ? serverMessage(error) : '';
      patchTab(ctx.category, { loading: false, searched: true, error: { kind, message } });
      if (kind === 'capped') setUsage((u) => (u ? { ...u, used: u.cap } : u));
      if (kind === 'other' || kind === 'rateLimited') toast.error(getToastError(error, 'Could not search LinkedIn'));
    }
    function onUsage(next) { setUsage(next); }
    function onImport(result) {
      setImporting(false);
      setImported(result);
    }
    function onImportFailure(error) {
      setImporting(false);
      const kind = discoverFailureKind(error);
      toast.error(kind === 'budget' || kind === 'input' || kind === 'account'
        ? serverMessage(error) || getToastError(error, 'Could not import these people')
        : getToastError(error, 'Could not import these people'));
    }

    eventEmitter.on(DISCOVER_EVENTS.SEARCH_SUCCESS, onSearch);
    eventEmitter.on(DISCOVER_EVENTS.SEARCH_FAILURE, onSearchFailure);
    eventEmitter.on(DISCOVER_EVENTS.USAGE_SUCCESS, onUsage);
    eventEmitter.on(DISCOVER_EVENTS.IMPORT_AUTHORS_SUCCESS, onImport);
    eventEmitter.on(DISCOVER_EVENTS.IMPORT_AUTHORS_FAILURE, onImportFailure);
    return () => {
      eventEmitter.off(DISCOVER_EVENTS.SEARCH_SUCCESS, onSearch);
      eventEmitter.off(DISCOVER_EVENTS.SEARCH_FAILURE, onSearchFailure);
      eventEmitter.off(DISCOVER_EVENTS.USAGE_SUCCESS, onUsage);
      eventEmitter.off(DISCOVER_EVENTS.IMPORT_AUTHORS_SUCCESS, onImport);
      eventEmitter.off(DISCOVER_EVENTS.IMPORT_AUTHORS_FAILURE, onImportFailure);
    };
  }, [eventEmitter, toast, patchTab]);

  useEffect(() => { hubDiscoverController.getUsage(eventEmitter); }, [eventEmitter]);

  /** A fresh search on one tab. `query` is { keywords?, url?, datePostedId? }. */
  const search = useCallback((category, query) => {
    const seq = (seqRef.current[category] ?? 0) + 1;
    seqRef.current[category] = seq;
    const datePosted = DATE_POSTED_OPTIONS.find((o) => o.id === query.datePostedId)?.value;
    const clean = {
      keywords: query.url ? undefined : (query.keywords ?? '').trim() || undefined,
      url: (query.url ?? '').trim() || undefined,
      filters: category === 'posts' && datePosted ? { datePosted } : undefined,
    };
    patchTab(category, { loading: true, items: [], cursor: null, total: null, error: null, query: clean });
    hubDiscoverController.search(eventEmitter, { category, ...clean }, { seq, append: false });
  }, [eventEmitter, patchTab]);

  /** The next page of what is shown, with the same query. */
  const loadMore = useCallback((category) => {
    const current = tabs[category];
    if (!current?.cursor || current.loading || !current.query) return;
    const seq = (seqRef.current[category] ?? 0) + 1;
    seqRef.current[category] = seq;
    patchTab(category, { loading: true, error: null });
    hubDiscoverController.search(eventEmitter, { category, ...current.query, cursor: current.cursor }, { seq, append: true });
  }, [eventEmitter, patchTab, tabs]);

  const importAuthors = useCallback((authors, keywords) => {
    setImporting(true);
    setImported(null);
    hubDiscoverController.importAuthors(eventEmitter, { authors, keywords });
  }, [eventEmitter]);

  const dismissImported = useCallback(() => setImported(null), []);

  return { tab, setTab, tabs, usage, search, loadMore, importing, imported, importAuthors, dismissImported };
}
