import hubProfileGateway from '../gateway/profile.js';
import { PROFILE_EVENTS } from '../constants/constants.js';

/**
 * Profile controller -- the one thing the onboarding profile step (and the
 * audience step, which reads the saved ICP) may call. try/catch and
 * async/await live here (and in the gateway) only; every method takes the
 * caller's `eventEmitter` first and reports the outcome by emitting an event
 * instead of returning or throwing.
 */

async function get(eventEmitter) {
  try {
    const profile = await hubProfileGateway.get();
    eventEmitter.emit(PROFILE_EVENTS.GET_SUCCESS, profile);
  } catch (error) {
    eventEmitter.emit(PROFILE_EVENTS.GET_FAILURE, error);
  }
}

async function refresh(eventEmitter) {
  try {
    const profile = await hubProfileGateway.refresh();
    eventEmitter.emit(PROFILE_EVENTS.REFRESH_SUCCESS, profile);
  } catch (error) {
    eventEmitter.emit(PROFILE_EVENTS.REFRESH_FAILURE, error);
  }
}

async function saveIcp(eventEmitter, icp) {
  try {
    const saved = await hubProfileGateway.saveIcp(icp);
    eventEmitter.emit(PROFILE_EVENTS.SAVE_ICP_SUCCESS, saved);
  } catch (error) {
    eventEmitter.emit(PROFILE_EVENTS.SAVE_ICP_FAILURE, error);
  }
}

const profileController = { get, refresh, saveIcp };
export default profileController;
