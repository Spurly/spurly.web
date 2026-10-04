import limitsGateway from '../gateway/limits.js';
import { LIMITS_EVENTS } from '../constants/constants.js';

/**
 * Limits Controller
 * try/catch and async/await live here (and in the gateway) only. Emits
 * events; the hook subscribes and never touches the raw response.
 */
async function load(eventEmitter) {
  try {
    const res = await limitsGateway.get();
    if (!res?.success) throw new Error(res?.message || 'Failed to load your limits');
    eventEmitter.emit(LIMITS_EVENTS.LOAD_SUCCESS, res.data);
  } catch (error) {
    eventEmitter.emit(LIMITS_EVENTS.LOAD_FAILURE, error?.response?.data?.message || error?.message || 'Failed to load your limits');
  }
}

async function savePreferences(eventEmitter, preferences) {
  try {
    const res = await limitsGateway.savePreferences(preferences);
    if (!res?.success) throw new Error(res?.message || 'Failed to save sending settings');
    eventEmitter.emit(LIMITS_EVENTS.SAVE_SUCCESS, res.data?.quiet);
  } catch (error) {
    eventEmitter.emit(LIMITS_EVENTS.SAVE_FAILURE, error?.response?.data?.message || error?.message || 'Failed to save sending settings');
  }
}

const limitsController = { load, savePreferences };
export default limitsController;
