import hubAccountHealthGateway from '../gateway/accountHealth.js';
import { ACCOUNT_HEALTH_EVENTS } from '../constants/constants.js';

/**
 * Account-health controller — the one thing the settings page/hook may call.
 * try/catch and async/await live here (and in the gateway) only; every method
 * takes the caller's `eventEmitter` first and reports the outcome by emitting
 * an event instead of returning or throwing.
 */

async function get(eventEmitter) {
  try {
    const health = await hubAccountHealthGateway.get();
    eventEmitter.emit(ACCOUNT_HEALTH_EVENTS.GET_SUCCESS, health);
  } catch (error) {
    eventEmitter.emit(ACCOUNT_HEALTH_EVENTS.GET_FAILURE, error);
  }
}

async function refresh(eventEmitter) {
  try {
    const health = await hubAccountHealthGateway.refresh();
    eventEmitter.emit(ACCOUNT_HEALTH_EVENTS.REFRESH_SUCCESS, health);
  } catch (error) {
    eventEmitter.emit(ACCOUNT_HEALTH_EVENTS.REFRESH_FAILURE, error);
  }
}

const accountHealthController = { get, refresh };
export default accountHealthController;
