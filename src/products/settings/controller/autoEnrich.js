import hubAutoEnrichGateway from '../gateway/autoEnrich.js';
import { AUTO_ENRICH_EVENTS } from '../constants/constants.js';

/**
 * Controller for this setting. try/catch and async/await live here (and in the gateway) only; every method takes the
 * caller's `eventEmitter` first and reports the outcome by emitting an event.
 */

async function get(eventEmitter) {
  try {
    eventEmitter.emit(AUTO_ENRICH_EVENTS.GET_SUCCESS, await hubAutoEnrichGateway.get());
  } catch (error) {
    eventEmitter.emit(AUTO_ENRICH_EVENTS.GET_FAILURE, error);
  }
}

async function set(eventEmitter, patch) {
  try {
    eventEmitter.emit(AUTO_ENRICH_EVENTS.SET_SUCCESS, await hubAutoEnrichGateway.set(patch));
  } catch (error) {
    eventEmitter.emit(AUTO_ENRICH_EVENTS.SET_FAILURE, error);
  }
}

const autoEnrichController = { get, set };
export default autoEnrichController;
