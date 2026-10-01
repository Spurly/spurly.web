import hubProfileViewersGateway from '../gateway/profileViewers.js';
import { PROFILE_VIEWERS_EVENTS } from '../constants/constants.js';

/** The one thing the Profile viewers page may call — never the gateway directly. */

async function getViewers(eventEmitter, params) {
  try {
    const data = await hubProfileViewersGateway.getViewers(params);
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_FAILURE, error);
  }
}

async function syncViewers(eventEmitter) {
  try {
    const data = await hubProfileViewersGateway.syncViewers();
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_FAILURE, error);
  }
}

const hubProfileViewersController = { getViewers, syncViewers };
export default hubProfileViewersController;
