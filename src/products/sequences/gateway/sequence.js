import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Sequence } from '../entities/sequence.js';

/**
 * Hub sequences API client.
 *
 * A sequence is an ordered, linear list of steps run against enrolled leads
 * — a smaller build than a branching canvas, per UNIPILE_MODULE_PLAN_V2.md
 * §4. Creating one is a real POST (unlike a campaign, the backend requires
 * at least one step to save at all — see stepTypes.js#validateSteps), but
 * nothing runs until leads are enrolled and the sequence is started.
 *
 * Plain async functions, no try/catch: the shared apiGateway response
 * interceptor already normalizes every failure.
 */

/** POST /hub/sequences — create a draft. Needs at least one step. */
async function createSequence({ name, steps } = {}) {
  const res = await apiGateway.post('/hub/sequences', { name, steps });
  return Sequence.fromResponse(res.data?.data?.sequence ?? null);
}

/** GET /hub/sequences — the list. No enrollment counts (kept lean, one query). */
async function listSequences() {
  const res = await apiGateway.get('/hub/sequences');
  return Sequence.fromList(res.data?.data?.sequences ?? []);
}

/** GET /hub/sequences/:id — the sequence plus enrollment status counts. */
async function getSequence(id) {
  const res = await apiGateway.get(`/hub/sequences/${id}`);
  const data = res.data?.data ?? null;
  if (!data) return null;
  return { ...data, sequence: Sequence.fromResponse(data.sequence) };
}

/**
 * PATCH /hub/sequences/:id — rename or edit steps.
 *
 * Only works while the sequence is a draft — the server 409s otherwise
 * (SEQUENCE_NOT_EDITABLE), since a step already mid-flight for an enrolled
 * lead cannot be safely rewritten out from under it.
 */
async function updateSequence(id, { name, steps } = {}) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (steps !== undefined) body.steps = steps;
  const res = await apiGateway.patch(`/hub/sequences/${id}`, body);
  return Sequence.fromResponse(res.data?.data?.sequence ?? null);
}

/** GET /hub/sequences/:id/enrollments — the enrollments table. */
async function listEnrollments(id, { status, page = 1, limit = 50 } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await apiGateway.get(`/hub/sequences/${id}/enrollments`, { params });
  return res.data?.data ?? { enrollments: [], total: 0, page: 1, limit };
}

/**
 * POST /hub/sequences/:id/enrollments — enroll leads into this sequence.
 * Returns { enrolled } — how many actually joined, which can be fewer
 * than selected (already-enrolled or unresolvable leads are skipped).
 */
async function enrollLeads(id, { leadIds, searchId } = {}) {
  const res = await apiGateway.post(`/hub/sequences/${id}/enrollments`, { leadIds, searchId });
  return res.data?.data ?? { enrolled: 0 };
}

/** POST /hub/sequences/:id/start — begin or resume running. */
async function startSequence(id) {
  const res = await apiGateway.post(`/hub/sequences/${id}/start`);
  return Sequence.fromResponse(res.data?.data?.sequence ?? null);
}

/** POST /hub/sequences/:id/pause — stop running, keep enrollment progress. */
async function pauseSequence(id) {
  const res = await apiGateway.post(`/hub/sequences/${id}/pause`);
  return Sequence.fromResponse(res.data?.data?.sequence ?? null);
}

/** DELETE /hub/sequences/:id — remove the sequence and its enrollments. */
async function deleteSequence(id) {
  const res = await apiGateway.delete(`/hub/sequences/${id}`);
  return res.data?.data ?? {};
}

const hubSequencesGateway = {
  createSequence,
  listSequences,
  getSequence,
  updateSequence,
  listEnrollments,
  enrollLeads,
  startSequence,
  pauseSequence,
  deleteSequence,
};
export default hubSequencesGateway;
