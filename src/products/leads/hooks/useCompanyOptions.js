import { useCallback, useEffect, useRef, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import leadController from '../controller/lead.js';
import { LEAD_EVENTS } from '../constants/constants.js';

/**
 * Options for the Leads table's Company filter — server-searched and
 * paginated, because a big lead list has thousands of companies.
 *
 * Nothing loads until the dropdown opens (`enabled`). Typing restarts from
 * page 1 (debounced 250ms); `loadMore` fetches the next page when the list
 * is scrolled to its end. Responses that arrive after a newer search are
 * dropped by a request token, so a slow early keystroke can never overwrite
 * a later result. Same event-emitter contract as useLeadsPage — no
 * async/await or try/catch here.
 */

const PAGE_SIZE = 30;

export function useCompanyOptions({ enabled, searchId }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tokenRef = useRef(null);

  const fetchPage = useCallback(
    (nextPage, q) => {
      const token = {};
      tokenRef.current = token;
      setLoading(true);
      setError(null);
      const emitter = new EventEmitter();
      emitter.once(LEAD_EVENTS.LIST_COMPANIES_SUCCESS, (data) => {
        if (tokenRef.current !== token) return;
        setItems((prev) => (nextPage === 1 ? data.companies : [...prev, ...data.companies]));
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
        setLoading(false);
      });
      emitter.once(LEAD_EVENTS.LIST_COMPANIES_FAILURE, () => {
        if (tokenRef.current !== token) return;
        setError('Couldn’t load companies');
        setLoading(false);
      });
      leadController.listLeadCompanies(emitter, { searchId, q, page: nextPage, limit: PAGE_SIZE });
    },
    [searchId],
  );

  // (Re)load page 1 when opened, when the search changes, or the audience does.
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setTimeout(() => fetchPage(1, query), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [enabled, query, fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || page === 0) return;
    fetchPage(page + 1, query);
  }, [loading, hasMore, page, query, fetchPage]);

  return { query, setQuery, items, hasMore, loading, error, loadMore };
}
