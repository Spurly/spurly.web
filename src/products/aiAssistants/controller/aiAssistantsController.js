import gateway from '../gateway/aiAssistantsGateway.js';
import { AI_EVENTS as E } from '../constants/constants.js';
import { toToken, toConnectedApp, toActivityRow } from '../entities/aiAssistants.js';

/**
 * AI assistants controller. Reports every outcome over the caller's `eventEmitter`; try/catch
 * lives here and nowhere above it. Failure events carry the raw error.
 */

function unwrap(res, fallback) {
  if (!res?.success) {
    const error = new Error(res?.message || fallback);
    error.code = res?.code;
    throw error;
  }
  return res.data;
}

async function loadTokens(emitter) {
  try {
    const data = unwrap(await gateway.listTokens(), 'Failed to load tokens');
    emitter.emit(E.TOKENS_SUCCESS, { tokens: (data?.tokens ?? []).map(toToken) });
  } catch (error) {
    emitter.emit(E.TOKENS_FAILURE, error);
  }
}

/** Emits CREATE_SUCCESS with { token (plaintext, shown once), apiToken }. */
async function createToken(emitter, payload) {
  try {
    const data = unwrap(await gateway.createToken(payload), 'Failed to create token');
    emitter.emit(E.CREATE_SUCCESS, { secret: data.token, apiToken: toToken(data.apiToken) });
  } catch (error) {
    emitter.emit(E.CREATE_FAILURE, error);
  }
}

async function revokeToken(emitter, id) {
  try {
    unwrap(await gateway.revokeToken(id), 'Failed to revoke token');
    emitter.emit(E.REVOKE_SUCCESS, { id });
  } catch (error) {
    emitter.emit(E.REVOKE_FAILURE, error);
  }
}

async function loadConnectedApps(emitter) {
  try {
    const data = unwrap(await gateway.listConnections(), 'Failed to load connected apps');
    emitter.emit(E.APPS_SUCCESS, { apps: (data?.connections ?? []).map(toConnectedApp) });
  } catch (error) {
    emitter.emit(E.APPS_FAILURE, error);
  }
}

async function disconnectApp(emitter, id) {
  try {
    unwrap(await gateway.removeConnection(id), 'Failed to disconnect');
    emitter.emit(E.DISCONNECT_SUCCESS, { id });
  } catch (error) {
    emitter.emit(E.DISCONNECT_FAILURE, error);
  }
}

async function loadActionSwitch(emitter) {
  try {
    const data = unwrap(await gateway.getSettings(), 'Failed to load settings');
    emitter.emit(E.SWITCH_SUCCESS, { enabled: Boolean(data?.mcpActionsEnabled) });
  } catch (error) {
    emitter.emit(E.SWITCH_FAILURE, error);
  }
}

async function setActionSwitch(emitter, enabled) {
  try {
    const data = unwrap(await gateway.updateSettings(Boolean(enabled)), 'Failed to save setting');
    emitter.emit(E.SWITCH_SUCCESS, { enabled: Boolean(data?.mcpActionsEnabled) });
  } catch (error) {
    emitter.emit(E.SWITCH_FAILURE, error);
  }
}

async function loadActivity(emitter) {
  try {
    const data = unwrap(await gateway.listActivity(), 'Failed to load activity');
    emitter.emit(E.ACTIVITY_SUCCESS, { calls: (data?.calls ?? []).map(toActivityRow) });
  } catch (error) {
    emitter.emit(E.ACTIVITY_FAILURE, error);
  }
}

/** params: the raw authorize query (client_id, redirect_uri, scope, state, code_challenge, ...). */
async function loadConsentInfo(emitter, params) {
  try {
    const data = unwrap(await gateway.consentInfo(params), 'This request is not valid');
    emitter.emit(E.CONSENT_INFO_SUCCESS, { client: data.client, scopes: data.scopes ?? [] });
  } catch (error) {
    emitter.emit(E.CONSENT_INFO_FAILURE, error);
  }
}

/** Emits CONSENT_SUCCESS with { redirectTo }: where to send the browser (back to the app, with code or error). */
async function submitConsent(emitter, params, { approved, scopes }) {
  try {
    const data = unwrap(await gateway.submitConsent({ ...params, approved, scopes }), 'Could not complete the request');
    emitter.emit(E.CONSENT_SUCCESS, { redirectTo: data.redirectTo, approved });
  } catch (error) {
    emitter.emit(E.CONSENT_FAILURE, error);
  }
}

export default {
  loadTokens,
  createToken,
  revokeToken,
  loadConnectedApps,
  disconnectApp,
  loadActionSwitch,
  setActionSwitch,
  loadActivity,
  loadConsentInfo,
  submitConsent,
};
