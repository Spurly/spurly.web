import hubAccountGateway from '../gateway/account.js';
import { ACCOUNT_EVENTS } from '../constants/constants.js';

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

async function createLink(eventEmitter) {
  try {
    const data = await hubAccountGateway.createLink();
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

const accountController = { get, createLink, refresh, disconnect };
export default accountController;
