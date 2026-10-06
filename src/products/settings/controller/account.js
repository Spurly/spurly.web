import hubAccountGateway from '../gateway/account.js';
import { ACCOUNT_EVENTS, NATIVE_CONNECT_EVENTS } from '../constants/constants.js';

/**
 * Hub account controller — the one thing the settings page/hook is allowed
 * to call. Never the gateway directly. try/catch and async/await live here
 * (and in the gateway) only; every method takes the caller's `eventEmitter`
 * first and reports the outcome by emitting an event instead of returning
 * or throwing.
 */

async function get(eventEmitter) {
  try {
    const account = await hubAccountGateway.get();
    eventEmitter.emit(ACCOUNT_EVENTS.GET_SUCCESS, account);
  } catch (error) {
    eventEmitter.emit(ACCOUNT_EVENTS.GET_FAILURE, error);
  }
}

async function createLink(eventEmitter, returnTo) {
  try {
    const data = await hubAccountGateway.createLink(returnTo);
    eventEmitter.emit(ACCOUNT_EVENTS.CREATE_LINK_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ACCOUNT_EVENTS.CREATE_LINK_FAILURE, error);
  }
}

async function refresh(eventEmitter) {
  try {
    const account = await hubAccountGateway.refresh();
    eventEmitter.emit(ACCOUNT_EVENTS.REFRESH_SUCCESS, account);
  } catch (error) {
    eventEmitter.emit(ACCOUNT_EVENTS.REFRESH_FAILURE, error);
  }
}

async function disconnect(eventEmitter) {
  try {
    const data = await hubAccountGateway.disconnect();
    eventEmitter.emit(ACCOUNT_EVENTS.DISCONNECT_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ACCOUNT_EVENTS.DISCONNECT_FAILURE, error);
  }
}

/**
 * Native sign-in steps. Each emits NATIVE_CONNECT_EVENTS.STEP_SUCCESS with
 * { state, checkpoint, account } or STEP_FAILURE with the server body — the
 * hook does not need to know which step answered, because every step can
 * answer with any next state.
 */
async function nativeStep(eventEmitter, run) {
  try {
    const step = await run();
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.STEP_SUCCESS, step);
  } catch (error) {
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.STEP_FAILURE, error);
  }
}

function connectWithCredentials(eventEmitter, input) {
  return nativeStep(eventEmitter, () => hubAccountGateway.connectWithCredentials(input));
}

async function getConnectOptions(eventEmitter) {
  try {
    const options = await hubAccountGateway.getConnectOptions();
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.OPTIONS_SUCCESS, options);
  } catch (error) {
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.OPTIONS_FAILURE, error);
  }
}

function solveCheckpoint(eventEmitter, code) {
  return nativeStep(eventEmitter, () => hubAccountGateway.solveCheckpoint(code));
}

function tryAnotherWay(eventEmitter) {
  return nativeStep(eventEmitter, () => hubAccountGateway.tryAnotherWay());
}

/** Polling has its own events so a late poll answer can never be read as a step's answer. */
async function checkpointStatus(eventEmitter) {
  try {
    const step = await hubAccountGateway.checkpointStatus();
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.POLL_SUCCESS, step);
  } catch (error) {
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.POLL_FAILURE, error);
  }
}

async function resendCheckpoint(eventEmitter) {
  try {
    const data = await hubAccountGateway.resendCheckpoint();
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.RESEND_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(NATIVE_CONNECT_EVENTS.RESEND_FAILURE, error);
  }
}

const accountController = {
  get,
  createLink,
  refresh,
  disconnect,
  connectWithCredentials,
  getConnectOptions,
  solveCheckpoint,
  tryAnotherWay,
  checkpointStatus,
  resendCheckpoint,
};
export default accountController;
