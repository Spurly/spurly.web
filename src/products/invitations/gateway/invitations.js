import apiGateway from 'src/shared/gateway/apiGateway.js';
import { DEFAULT_RULES } from '../constants/constants.js';

/** Thin wrappers over /hub/invitations/* and the per-lead network actions. Shapes are the server's own. */

async function getSent({ cursor } = {}) {
  const res = await apiGateway.get('/hub/invitations/sent', { params: cursor ? { cursor } : {} });
  const d = res.data?.data ?? {};
  return { items: d.items ?? [], cursor: d.cursor ?? null, staleAfterDays: d.staleAfterDays ?? 21 };
}

async function withdraw(invitationId) {
  const res = await apiGateway.delete(`/hub/invitations/sent/${encodeURIComponent(invitationId)}`);
  return { invitationId, message: res.data?.message ?? '' };
}

async function getReceived({ cursor } = {}) {
  const res = await apiGateway.get('/hub/invitations/received', { params: cursor ? { cursor } : {} });
  const d = res.data?.data ?? {};
  return { items: d.items ?? [], cursor: d.cursor ?? null };
}

async function respond({ invitationId, action, sharedSecret }) {
  const res = await apiGateway.post(`/hub/invitations/received/${encodeURIComponent(invitationId)}/respond`, { action, sharedSecret });
  return { invitationId, action, message: res.data?.message ?? '' };
}

async function getRules() {
  const res = await apiGateway.get('/hub/invitations/rules');
  return { ...DEFAULT_RULES, ...(res.data?.data ?? {}) };
}

async function saveRules(rules) {
  const res = await apiGateway.put('/hub/invitations/rules', rules);
  return { ...DEFAULT_RULES, ...(res.data?.data ?? {}) };
}

async function getUsage() {
  const res = await apiGateway.get('/hub/invitations/usage');
  return res.data?.data ?? { connected: false, usage: {} };
}

async function followLead(leadId) {
  const res = await apiGateway.post(`/hub/leads/${leadId}/follow`);
  return { message: res.data?.message ?? '' };
}

async function getLeadSkills(leadId) {
  const res = await apiGateway.get(`/hub/leads/${leadId}/skills`);
  return res.data?.data ?? { skills: [], endorsableCount: 0 };
}

async function endorseLead({ leadId, skillName }) {
  const res = await apiGateway.post(`/hub/leads/${leadId}/endorse`, { skillName });
  return { skillName, message: res.data?.message ?? '' };
}

const hubInvitationsGateway = { getSent, withdraw, getReceived, respond, getRules, saveRules, getUsage, followLead, getLeadSkills, endorseLead };
export default hubInvitationsGateway;
