import apiGateway from 'src/shared/gateway/apiGateway.js';

const EMPTY_USAGE = { used: 0, cap: 100, resetsAt: null };

/**
 * POST /hub/discover/:category (companies | jobs | posts).
 * Returns { companies|jobs|posts, rowCount, cursor, total, usage }. Spends one search page.
 */
async function search(category, { keywords, url, filters, cursor } = {}) {
  const res = await apiGateway.post(`/hub/discover/${category}`, { keywords, url, filters, cursor });
  const data = res.data?.data ?? {};
  return { rowCount: 0, cursor: null, total: null, usage: null, ...data, [category]: data[category] ?? [] };
}

/** GET /hub/discover/usage: search pages used today. Instant, no LinkedIn call. */
async function getUsage() {
  const res = await apiGateway.get('/hub/discover/usage');
  return { ...EMPTY_USAGE, ...(res.data?.data ?? {}) };
}

/** POST /hub/discover/posts/import-authors: selected post authors -> a new audience. */
async function importAuthors({ authors, name, keywords }) {
  const res = await apiGateway.post('/hub/discover/posts/import-authors', { authors, name, keywords });
  return res.data?.data ?? null;
}

const hubDiscoverGateway = { search, getUsage, importAuthors };
export default hubDiscoverGateway;
