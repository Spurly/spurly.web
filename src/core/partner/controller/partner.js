import partnerGateway from '../gateway/partner.js';
import apiGateway from 'src/shared/gateway/apiGateway.js';
import { PARTNER_EVENTS } from '../constants/constants.js';
import { clearImpersonation } from 'src/shared/utils/impersonation.js';
import { clearManagedSession, isManagedSession, markManagedSession } from 'src/shared/utils/managedSession.js';

/**
 * Partner controller: opens a managed session from a one-time ticket.
 * The only try/catch for "Open in Spurly" on the web (besides the gateway).
 */

/**
 * Spend the ticket and become that account.
 *
 * Replaces the browser session outright and stores it exactly as a login does
 * (`authToken` + `user`), plus the managed marker. A saved admin "login as"
 * session is dropped first, or its banner would sit over this account.
 * Emits SESSION_OPENED with { user }, or SESSION_FAILED with the error; on
 * failure nothing is stored.
 * @param {EventEmitter} eventEmitter
 * @param {string} ticket
 */
async function openAccount(eventEmitter, ticket) {
  try {
    const authResponse = await partnerGateway.exchangeTicket(ticket);

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    const token = authResponse.getToken();
    const user = authResponse.getUser();

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    clearImpersonation();
    apiGateway.setToken(token);
    localStorage.setItem('user', JSON.stringify(user.toJSON()));
    markManagedSession();

    eventEmitter.emit(PARTNER_EVENTS.SESSION_OPENED, { user });
  } catch (error) {
    eventEmitter.emit(PARTNER_EVENTS.SESSION_FAILED, error);
  }
}

/**
 * A NON-managed session already in this browser, or null.
 * "Non-managed" is: a token is stored and the managed marker is absent. The
 * email is the person's own, read from the stored user, for the sign-out prompt.
 * @returns {{ email: string } | null}
 */
function getExistingSession() {
  if (!apiGateway.isAuthenticated() || isManagedSession()) return null;
  const stored = localStorage.getItem('user');
  if (!stored) return { email: '' };
  let user;
  try {
    user = JSON.parse(stored);
  } catch {
    return { email: '' };
  }
  // A managed account signed in through its own direct login is also a
  // managed session: replacing it with (usually) the same account needs no prompt.
  if (user?.isManaged) return null;
  return { email: user?.email || '' };
}

/** The ended page has been shown: forget that this browser held a managed session. */
function acknowledgeEnded() {
  clearManagedSession();
}

const partnerController = {
  openAccount,
  getExistingSession,
  acknowledgeEnded,
};

export default partnerController;
