import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * AI assistants API client: personal access tokens, connected apps (OAuth), the account
 * action switch, recent activity, and the OAuth consent calls. Plain async functions; the
 * shared gateway interceptor already normalises failures.
 */

const listTokens = async () => (await apiGateway.get('/api-tokens')).data;
const createToken = async (payload) => (await apiGateway.post('/api-tokens', payload)).data;
const revokeToken = async (id) => (await apiGateway.delete(`/api-tokens/${id}`)).data;

const getSettings = async () => (await apiGateway.get('/api-tokens/settings')).data;
const updateSettings = async (mcpActionsEnabled) => (await apiGateway.put('/api-tokens/settings', { mcpActionsEnabled })).data;

const listConnections = async () => (await apiGateway.get('/oauth/connections')).data;
const removeConnection = async (id) => (await apiGateway.delete(`/oauth/connections/${id}`)).data;

const listActivity = async (limit = 25) => (await apiGateway.get('/mcp/activity', { params: { limit } })).data;

const consentInfo = async (params) => (await apiGateway.get('/oauth/consent-info', { params })).data;
const submitConsent = async (body) => (await apiGateway.post('/oauth/consent', body)).data;

export default {
  listTokens,
  createToken,
  revokeToken,
  getSettings,
  updateSettings,
  listConnections,
  removeConnection,
  listActivity,
  consentInfo,
  submitConsent,
};
