import orgGateway from '../gateway/org.js';
import apiGateway from 'src/shared/gateway/apiGateway.js';
import { User } from 'src/core/auth/entities/User.js';
import { ORG_EVENTS } from '../constants/constants.js';
import { clearImpersonation } from 'src/shared/utils/impersonation.js';
import { clearManagedSession } from 'src/shared/utils/managedSession.js';
import { markOrgSession, isOrgSessionFor } from 'src/shared/utils/orgSession.js';
import { setActiveAccountId } from 'src/shared/orgAccount/activeAccount.js';

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
 * Become the member a sign-in answered with. Stored exactly as a login does
 * (`authToken` + `user`), plus the org marker. A saved admin "login as" session
 * and a managed marker are dropped first. Throws (storing nothing) on an answer
 * without a token or user.
 */
function adoptSession(data) {
  if (!data.token || !data.user) throw new Error('Invalid response from server');
  const user = User.fromResponse({
    _id: data.user.id, name: data.user.name, email: data.user.email, onboardingComplete: true, onboardingStage: 'done',
  });
  clearImpersonation();
  clearManagedSession();
  apiGateway.setToken(data.token);
  localStorage.setItem('user', JSON.stringify(user.toJSON()));
  markOrgSession(data.user.id);
  return user;
}

/** Check the code and become that member. On failure nothing is stored. */
async function verifyLoginCode(eventEmitter, email, code) {
  try {
    const data = await orgGateway.verifyLoginCode(email, code);
    const user = adoptSession(data);
    eventEmitter.emit(ORG_EVENTS.SESSION_OPENED, { user, orgs: data.orgs || [] });
  } catch (error) {
    eventEmitter.emit(ORG_EVENTS.SESSION_FAILED, error);
  }
}

/** Sign in with the member's own password. On failure nothing is stored. */
async function passwordLogin(eventEmitter, email, password) {
  try {
    const data = await orgGateway.passwordLogin(email, password);
    const user = adoptSession(data);
    eventEmitter.emit(ORG_EVENTS.SESSION_OPENED, { user, orgs: data.orgs || [] });
  } catch (error) {
    eventEmitter.emit(ORG_EVENTS.SESSION_FAILED, error);
  }
}

/** Set the password with the emailed code and become that member. On failure nothing is stored. */
async function resetPassword(eventEmitter, email, code, password) {
  try {
    const data = await orgGateway.resetPassword(email, code, password);
    const user = adoptSession(data);
    eventEmitter.emit(ORG_EVENTS.SESSION_OPENED, { user, orgs: data.orgs || [] });
  } catch (error) {
    eventEmitter.emit(ORG_EVENTS.SESSION_FAILED, error);
  }
}

/**
 * Spend a partner's one-time "Open in Spurly" ticket and become that organization's member.
 * The link may also have chosen one LinkedIn account: it becomes the "Acting as" account
 * (set after the session is stored, because that choice belongs to the signed-in member).
 * Without a chosen account an existing choice is left alone. On failure nothing is stored.
 */
async function openFromLink(eventEmitter, ticket) {
  try {
    const data = await orgGateway.exchangeLoginTicket(ticket);
    const user = adoptSession(data);
    if (data.accountId) setActiveAccountId(data.accountId);
    eventEmitter.emit(ORG_EVENTS.SESSION_OPENED, { user, orgs: data.orgs || [], accountId: data.accountId || '' });
  } catch (error) {
    eventEmitter.emit(ORG_EVENTS.SESSION_FAILED, error);
  }
}

/**
 * A session already in this browser that opening a link would replace, or null.
 * An organization member's own session is not asked about (opening their org again is the
 * normal case); a personal or managed session is, because the link signs it out.
 * @returns {{ email: string } | null}
 */
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function getExistingSession() {
  if (!apiGateway.isAuthenticated()) return null;
  const user = readStoredUser();
  if (user && isOrgSessionFor(user)) return null;
  return { email: user?.email || '' };
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

const loadMembers = (eventEmitter, orgId) => run(eventEmitter, () => orgGateway.getMembers(orgId), ORG_EVENTS.MEMBERS_LOADED, ORG_EVENTS.MEMBERS_FAILED);

const inviteMember = (eventEmitter, orgId, email) => run(
  eventEmitter, () => orgGateway.inviteMember(orgId, email), ORG_EVENTS.MEMBER_CHANGED, ORG_EVENTS.MEMBER_CHANGE_FAILED,
);

const revokeInvite = (eventEmitter, orgId, inviteId) => run(
  eventEmitter, () => orgGateway.revokeInvite(orgId, inviteId), ORG_EVENTS.MEMBER_CHANGED, ORG_EVENTS.MEMBER_CHANGE_FAILED,
);

const removeMember = (eventEmitter, orgId, memberId) => run(
  eventEmitter, () => orgGateway.removeMember(orgId, memberId), ORG_EVENTS.MEMBER_CHANGED, ORG_EVENTS.MEMBER_CHANGE_FAILED,
);

const orgController = { loadMembers, inviteMember, revokeInvite, removeMember, requestLoginCode, verifyLoginCode, passwordLogin, resetPassword, openFromLink, getExistingSession, loadOrgs, loadState, loadAccounts, disconnectAccount, setWorkspace };

export default orgController;
