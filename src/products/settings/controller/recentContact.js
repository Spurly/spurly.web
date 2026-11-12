import hubRecentContactGateway from '../gateway/recentContact.js';
import { RECENT_CONTACT_EVENTS } from '../constants/constants.js';

/**
 * Controller for this setting. try/catch and async/await live here (and in the gateway) only; every method takes the
 * caller's `eventEmitter` first and reports the outcome by emitting an event.
 */

async function get(eventEmitter) {
  try {
    eventEmitter.emit(RECENT_CONTACT_EVENTS.GET_SUCCESS, await hubRecentContactGateway.get());
  } catch (error) {
    eventEmitter.emit(RECENT_CONTACT_EVENTS.GET_FAILURE, error);
  }
}

async function set(eventEmitter, patch) {
  try {
    eventEmitter.emit(RECENT_CONTACT_EVENTS.SET_SUCCESS, await hubRecentContactGateway.set(patch));
  } catch (error) {
    eventEmitter.emit(RECENT_CONTACT_EVENTS.SET_FAILURE, error);
  }
}

const recentContactController = { get, set };
export default recentContactController;
