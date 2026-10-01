/**
 * Pure helpers for the Discover page.
 */

/** What a failed search or import means for the page. */
export function discoverFailureKind(error) {
  const code = error?.code ?? error?.response?.data?.code;
  if (code === 'NO_ACCOUNT' || code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') return 'account';
  if (code === 'DISCOVER_DAILY_CAP') return 'capped';
  if (code === 'FEATURE_LOCKED') return 'locked';
  if (code === 'WRONG_SEARCH_CATEGORY' || code === 'BAD_REQUEST') return 'input';
  if (code === 'FETCH_LIMIT_DAY' || code === 'FETCH_LIMIT_MONTH' || code === 'FETCH_COUNT_TOO_LARGE') return 'budget';
  if (code === 'RATE_LIMITED') return 'rateLimited';
  return 'other';
}

/** The server's own sentence for refusals it words itself (input, cap, budget). */
export function serverMessage(error) {
  const message = error?.response?.data?.message;
  return typeof message === 'string' ? message : '';
}

/**
 * Jobs grouped by company, newest posting first inside a group and groups with
 * the most open roles first. A job without a company id is kept under its own
 * "no company" group per job, so it is listed but has no company actions.
 * Merging a next page re-groups the whole list, so a company that appears on
 * both pages is one row.
 */
export function groupJobsByCompany(jobs) {
  const groups = new Map();
  for (const job of jobs ?? []) {
    const key = job.company?.companyId ? `c:${job.company.companyId}` : `j:${job.jobId}`;
    if (!groups.has(key)) groups.set(key, { key, company: job.company ?? null, jobs: [] });
    groups.get(key).jobs.push(job);
  }
  const time = (job) => (job.postedAt ? new Date(job.postedAt).getTime() : 0);
  return [...groups.values()]
    .map((g) => ({ ...g, jobs: [...g.jobs].sort((a, b) => time(b) - time(a)), newestAt: Math.max(...g.jobs.map(time)) }))
    .sort((a, b) => b.jobs.length - a.jobs.length || b.newestAt - a.newestAt);
}

/** First `max` characters of a post, on one line. */
export function snippet(text, max = 220) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** The route of a company's own page. Slug first, numeric id otherwise. */
export function companyPath(company) {
  const key = company?.slug || company?.companyId;
  return key ? `/hub/company/${encodeURIComponent(key)}` : null;
}

/** Router state that opens the New audience dialog on the Leads page with this company filled in. */
export function findPeopleState(company) {
  return { newAudience: true, newAudienceCompany: { id: String(company.companyId), name: company.name || 'Company' } };
}

/** The author objects the import endpoint takes, from selected post rows. */
export function authorsFromPosts(posts) {
  return (posts ?? []).map((p) => p.author).filter(Boolean);
}

/**
 * The filters a search sends: only the ones that are set, as the backend takes
 * them (ids, not picker objects). Pure. Returns undefined when nothing is set
 * so the request carries no empty `filters`.
 */
export function compactFilters(filters) {
  const out = {};
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === null || value === '' || value === 'any' || value === false) continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      out[key] = value.map((v) => (v && typeof v === 'object' ? v.id : v));
    } else if (typeof value === 'object') {
      if (value.id) out[key] = value.id;
    } else {
      out[key] = value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}
