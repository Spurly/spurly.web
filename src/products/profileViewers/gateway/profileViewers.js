import apiGateway from 'src/shared/gateway/apiGateway.js';
import { PAGE_SIZE } from '../constants/constants.js';

const EMPTY = {
  viewers: [],
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  summary: { identifiedTotal: 0, last7d: 0, last30d: 0, partialCount: 0, lockedCount: 0 },
  partial: [],
  state: { lastSyncAt: null, lastAttemptAt: null, lastError: '', lastErrorCode: '', limited: false },
  account: { connected: true, premium: null },
};

/** GET /hub/profile-viewers — stored viewers, the summary tiles and the sync state. Instant: no LinkedIn call. */
async function getViewers({ page = 1, limit = PAGE_SIZE, degree } = {}) {
  const params = { page, limit };
  if (degree) params.degree = degree;
  const res = await apiGateway.get('/hub/profile-viewers', { params });
  return { ...EMPTY, ...(res.data?.data ?? {}) };
}

/** POST /hub/profile-viewers/sync — read LinkedIn now. Returns { result, message }. */
async function syncViewers() {
  const res = await apiGateway.post('/hub/profile-viewers/sync');
  return { result: res.data?.data?.result ?? null, message: res.data?.message ?? '' };
}

const hubProfileViewersGateway = { getViewers, syncViewers };
export default hubProfileViewersGateway;
