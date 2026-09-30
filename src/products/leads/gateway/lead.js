import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Audience } from '../entities/audience.js';
import { Lead } from '../entities/lead.js';

/**
 * Hub sourcing API client.
 *
 * Talks to /api/hub/searches and /api/hub/leads. A "search" is one saved
 * audience: a LinkedIn search URL the user pasted, which the server pages
 * through in the background and turns into leads.
 *
 * Importing is NOT request/response — a thousand leads is roughly a hundred
 * calls to LinkedIn. Creating a search only queues it; a worker picks it up
 * within the minute and the page polls for progress. Nothing here waits.
 *
 * Plain async functions, no try/catch: the shared apiGateway response
 * interceptor already normalizes every failure.
 */

/**
 * POST /hub/searches — queue an import from EITHER a pasted URL OR (Phase 8)
 * a structured filter object. Exactly one of `searchUrl`/`filters` should
 * be set — the server 400s on both or neither, this just forwards whichever
 * the caller built.
 */
/**
 * `count` — how many NEW profiles to fetch this time (plan max, usually 100).
 * `onDuplicate` — only after the server answered 409 DUPLICATE_SEARCH:
 * 'append' fetches into that existing audience, 'new' makes a new audience
 * that continues from where the existing one stopped.
 */
async function createSearch({ searchUrl, filters, followers, name, count, onDuplicate }) {
  const res = await apiGateway.post('/hub/searches', { searchUrl, filters, followers, name, count, onDuplicate });
  return {
    audience: Audience.fromResponse(res.data?.data?.search ?? null),
    appended: Boolean(res.data?.data?.appended),
  };
}

/**
 * POST /hub/searches/import — Phase 11. Queue an audience built from
 * profiles the extension/CSV import already captured (People page,
 * Import page), rather than a fresh LinkedIn search. `seeds` is an array
 * of `{ profileUrl, publicIdentifier?, name?, headline?, location?,
 * companyName?, currentTitle?, profilePictureUrl? }` — the server
 * resolves each one through the same Unipile full-profile call a search
 * lead gets, so an imported lead arrives just as complete.
 */
async function createManualAudience({ name, seeds }) {
  const res = await apiGateway.post('/hub/searches/import', { name, seeds });
  return Audience.fromResponse(res.data?.data?.search ?? null);
}

/**
 * GET /hub/audience/params — Phase 8. Free-text -> LinkedIn internal id
 * lookup, for the filter-builder's autocomplete. `type` is the vendor's
 * own vocabulary (LOCATION, INDUSTRY, COMPANY, SCHOOL, ... — SKILL exists
 * at the vendor but the backend's structured-search allow-list has no field
 * for it on Classic tier, so it is not offered here). Matching is fuzzy on
 * the vendor's side — always show `title`, never assume the first result.
 */
async function searchAudienceParams({ type, keywords, limit } = {}) {
  const params = { type };
  if (keywords) params.keywords = keywords;
  if (limit) params.limit = limit;
  const res = await apiGateway.get('/hub/audience/params', { params });
  return res.data?.data?.params ?? [];
}

/** GET /hub/searches — every audience with its progress. */
async function listSearches() {
  const res = await apiGateway.get('/hub/searches');
  return Audience.fromList(res.data?.data?.searches ?? []);
}

/** GET /hub/searches/:id — one audience, for polling while it runs. */
async function getSearch(id) {
  const res = await apiGateway.get(`/hub/searches/${id}`);
  return Audience.fromResponse(res.data?.data?.search ?? null);
}

/**
 * POST /hub/searches/:id/run — resume or re-run.
 *
 * One audience is one row: an import that stopped part-way resumes from its
 * cursor, and a finished one starts a fresh pass to pick up people who have
 * appeared since. Leads dedupe either way, so this never doubles anyone.
 */
async function runSearch(id, { count } = {}) {
  const res = await apiGateway.post(`/hub/searches/${id}/run`, { count });
  return Audience.fromResponse(res.data?.data?.search ?? null);
}

/** POST /hub/lists — a custom list from selected leads. */
async function createList({ name, leadIds }) {
  const res = await apiGateway.post('/hub/lists', { name, leadIds });
  const data = res.data?.data ?? {};
  return { audience: Audience.fromResponse(data.audience ?? null), added: data.added ?? 0 };
}

/** POST /hub/searches/:id/leads — add selected leads to an audience or list. */
async function addLeadsToAudience(id, { leadIds }) {
  const res = await apiGateway.post(`/hub/searches/${id}/leads`, { leadIds });
  return res.data?.data ?? { added: 0 };
}

/** POST /hub/searches/:id/leads/remove — take leads out (they stay in Leads). */
async function removeLeadsFromAudience(id, { leadIds }) {
  const res = await apiGateway.post(`/hub/searches/${id}/leads/remove`, { leadIds });
  return res.data?.data ?? { removed: 0 };
}

/** GET /hub/sourcing/usage — per-fetch max and today's/this month's budget. */
async function getSourcingUsage() {
  const res = await apiGateway.get('/hub/sourcing/usage');
  return res.data?.data?.usage ?? null;
}

/**
 * The company pages the connected account administers — the choices for
 * "Import followers" besides the user's own. Read from the stored account
 * health (GET /hub/account/health never waits on LinkedIn). Empty when the
 * account was never checked, has no pages, or the plan cannot see them: the
 * picker then simply offers "My followers" alone.
 */
async function getFollowerSources() {
  const res = await apiGateway.get('/hub/account/health');
  const pages = res.data?.data?.health?.capabilities?.companyPages;
  if (!Array.isArray(pages)) return [];
  return pages
    .filter((p) => p && p.id)
    .map((p) => ({ id: String(p.id), name: p.name || 'Company page' }));
}

/**
 * DELETE /hub/searches/:id — remove the audience.
 *
 * Leads survive by default and keep working: a lead can be in a campaign, and
 * the audience row records how the book was built rather than owning it.
 * Pass deleteLeads only where the user has been told what goes.
 */
async function deleteSearch(id, { deleteLeads = false } = {}) {
  const res = await apiGateway.delete(`/hub/searches/${id}${deleteLeads ? '?leads=delete' : ''}`);
  return res.data?.data ?? {};
}

/**
 * GET /hub/leads — the contacts table.
 * `enrichmentStatus` is a comma-separated allow-list (e.g.
 * 'none,queued,enriching,failed' for the Needs enrichment tab) — passed
 * straight through to the server so the filter is correct across every
 * page, not just whatever page the caller already has loaded.
 * `connectionDegree` is the same shape (comma-separated '1'/'2'/'3', e.g.
 * '1,2') for the Degree filter — server-side for the same reason: the
 * table is paginated, so filtering only what's already loaded would miss
 * matches on other pages.
 */
async function listLeads({ searchId, q, enrichmentStatus, connectionDegree, page = 1, limit = 50 } = {}) {
  const params = { page, limit };
  if (searchId) params.searchId = searchId;
  if (q) params.q = q;
  if (enrichmentStatus) params.enrichmentStatus = enrichmentStatus;
  if (connectionDegree) params.connectionDegree = connectionDegree;
  const res = await apiGateway.get('/hub/leads', { params });
  const data = res.data?.data ?? { leads: [], pagination: { page: 1, limit, total: 0 } };
  return { ...data, leads: Lead.fromList(data.leads ?? []) };
}

/**
 * GET /hub/leads/:id/profile — Phase 6's lazy resolve-once.
 *
 * Called when the lead drawer opens, not on a button press. The backend
 * itself decides whether that costs a real vendor call: a lead resolved
 * before comes back unchanged unless `force` is passed. Callers should
 * still show a loading state while this is in flight — an unresolved lead
 * can take the same 2-20s a full-profile fetch always has.
 */
async function resolveProfile(id, { force = false } = {}) {
  const res = await apiGateway.get(`/hub/leads/${id}/profile${force ? '?force=true' : ''}`);
  return Lead.fromResponse(res.data?.data?.lead ?? null);
}

/**
 * DELETE /hub/leads/:id/invitation — Phase 6 (1c) withdraw.
 *
 * Only meaningful when the lead carries a `pendingInvitationId` — set by
 * the server-side reconciliation job, not by anything the client does.
 * A lead nobody has reconciled yet has nothing here to withdraw; the
 * server 422s that case (NO_PENDING_INVITATION) rather than silently
 * no-opping.
 */
async function withdrawInvitation(id) {
  const res = await apiGateway.delete(`/hub/leads/${id}/invitation`);
  return Lead.fromResponse(res.data?.data?.lead ?? null);
}

const hubSourcingGateway = {
  createSearch,
  createManualAudience,
  searchAudienceParams,
  listSearches,
  getSearch,
  runSearch,
  deleteSearch,
  listLeads,
  resolveProfile,
  withdrawInvitation,
  createList,
  addLeadsToAudience,
  removeLeadsFromAudience,
  getSourcingUsage,
  getFollowerSources,
};
export default hubSourcingGateway;
