import orgGateway from '../gateway/org.js';
import apiGateway from 'src/shared/gateway/apiGateway.js';
import { User } from 'src/core/auth/entities/User.js';
import { ORG_EVENTS } from '../constants/constants.js';
import { clearImpersonation } from 'src/shared/utils/impersonation.js';
import { clearManagedSession } from 'src/shared/utils/managedSession.js';
import { markOrgSession } from 'src/shared/utils/orgSession.js';

/**
 * Org controller: sign-in by email + code, and the member's Organization page.
 * Every function takes the caller's `eventEmitter` first and reports by event.
 * The one try/catch for these screens (besides the gateway).
 */

async function run(eventEmitter, fn, successEvent, failureEvent) {
  try {
    eventEmitter.emit(successEvent, await fn());
  } catch (error) {
    eventEmitter.emit(failureEvent, error);
  }
}

const requestLoginCode = (eventEmitter, email) => run(
  eventEmitter, () => orgGateway.requestLoginCode(email), ORG_EVENTS.CODE_SENT, ORG_EVENTS.CODE_FAILED,
);

/**
 * Check the code and become that member. Stored exactly as a login does
 * (`authToken` + `user`), plus the org marker. A saved admin "login as" session
 * and a managed marker are dropped first. On failure nothing is stored.
 */
async function verifyLoginCode(eventEmitter, email, code) {
  try {
    const data = await orgGateway.verifyLoginCode(email, code);
    if (!data.token || !data.user) throw new Error('Invalid response from server');
    const user = User.fromResponse({
      _id: data.user.id, name: data.user.name, email: data.user.email, onboardingComplete: true, onboardingStage: 'done',
    });
    clearImpersonation();
    clearManagedSession();
    apiGateway.setToken(data.token);
    localStorage.setItem('user', JSON.stringify(user.toJSON()));
    markOrgSession(data.user.id);
    eventEmitter.emit(ORG_EVENTS.SESSION_OPENED, { user, orgs: data.orgs || [] });
  } catch (error) {
    eventEmitter.emit(ORG_EVENTS.SESSION_FAILED, error);
  }
}

const loadOrgs = (eventEmitter) => run(eventEmitter, () => orgGateway.getOrgs(), ORG_EVENTS.ORGS_LOADED, ORG_EVENTS.ORGS_FAILED);

const loadState = (eventEmitter) => run(eventEmitter, () => orgGateway.getState(), ORG_EVENTS.STATE_LOADED, ORG_EVENTS.STATE_FAILED);

const loadAccounts = (eventEmitter, params) => run(
  eventEmitter, () => orgGateway.getAccounts(params), ORG_EVENTS.ACCOUNTS_LOADED, ORG_EVENTS.ACCOUNTS_FAILED,
);

const disconnectAccount = (eventEmitter, accountId) => run(
  eventEmitter, () => orgGateway.disconnectAccount(accountId), ORG_EVENTS.ACCOUNT_DISCONNECTED, ORG_EVENTS.ACCOUNT_DISCONNECT_FAILED,
);

const setWorkspace = (eventEmitter, orgId, enabled) => run(
  eventEmitter, () => orgGateway.setWorkspace(orgId, enabled), ORG_EVENTS.WORKSPACE_SET, ORG_EVENTS.WORKSPACE_FAILED,
);

const orgController = { requestLoginCode, verifyLoginCode, loadOrgs, loadState, loadAccounts, disconnectAccount, setWorkspace };

export default orgController;
