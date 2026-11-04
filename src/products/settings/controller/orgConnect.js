import orgGateway from 'src/core/org/gateway/org.js';
import { NATIVE_CONNECT_EVENTS } from '../constants/constants.js';

/**
 * The LinkedIn sign-in dialog's controller for an ORGANIZATION account. Same
 * method names and events as `accountController`, so useLinkedInConnect and
 * the dialog work unchanged; only the endpoints differ (/org/accounts/connect*).
 *
 * The server hands back a `connectId` when a sign-in needs a checkpoint, and
 * every later step must send it. It lives in this closure, per dialog, not in
 * any shared state. Passing `accountId` reconnects that existing account.
 *
 * The one try/catch for this flow. Secrets pass straight through: never log.
 */
export function createOrgConnectController({ orgId, accountId = null }) {
  let connectId = null;

  const remember = (step) => {
    connectId = step?.state === 'checkpoint' ? (step.connectId ?? connectId) : null;
    return { state: step?.state ?? null, checkpoint: step?.checkpoint ?? null, account: step?.account ?? null };
  };

  async function nativeStep(eventEmitter, run) {
    try {
      eventEmitter.emit(NATIVE_CONNECT_EVENTS.STEP_SUCCESS, remember(await run()));
    } catch (error) {
      eventEmitter.emit(NATIVE_CONNECT_EVENTS.STEP_FAILURE, error);
    }
  }

  return {
    connectWithCredentials: (eventEmitter, input) => nativeStep(eventEmitter, () => orgGateway.connectAccount(orgId, input, accountId)),
    solveCheckpoint: (eventEmitter, code) => nativeStep(eventEmitter, () => orgGateway.solveCheckpoint(orgId, connectId, code)),
    tryAnotherWay: (eventEmitter) => nativeStep(eventEmitter, () => orgGateway.tryAnotherWay(orgId, connectId)),

    // The server decides where "Automatic" signs in from (the member's own IP), so there is nothing to detect here.
    getConnectOptions: async (eventEmitter) => {
      eventEmitter.emit(NATIVE_CONNECT_EVENTS.OPTIONS_SUCCESS, { detectedCountry: null });
    },

    async checkpointStatus(eventEmitter) {
      try {
        eventEmitter.emit(NATIVE_CONNECT_EVENTS.POLL_SUCCESS, remember(await orgGateway.connectStatus(orgId, connectId)));
      } catch (error) {
        eventEmitter.emit(NATIVE_CONNECT_EVENTS.POLL_FAILURE, error);
      }
    },

    async resendCheckpoint(eventEmitter) {
      try {
        eventEmitter.emit(NATIVE_CONNECT_EVENTS.RESEND_SUCCESS, await orgGateway.resendCheckpoint(orgId, connectId));
      } catch (error) {
        eventEmitter.emit(NATIVE_CONNECT_EVENTS.RESEND_FAILURE, error);
      }
    },
  };
}

export default createOrgConnectController;
