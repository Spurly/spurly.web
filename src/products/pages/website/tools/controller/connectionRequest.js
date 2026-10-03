import connectionRequestGateway from '../gateway/connectionRequest.js';
import { TOOL_EVENTS } from '../constants/constants.js';

/** Writes one connection note and reports through the emitter (no try/catch outside the controller). */
async function createNote(eventEmitter, input) {
  try {
    const data = await connectionRequestGateway.createNote(input);
    eventEmitter.emit(TOOL_EVENTS.CONNECTION_NOTE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(TOOL_EVENTS.CONNECTION_NOTE_FAILURE, error);
  }
}

const connectionRequestController = { createNote };
export default connectionRequestController;
