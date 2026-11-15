import hubSequencesGateway from '../gateway/sequence.js';
import { SEQUENCE_EVENTS } from '../constants/constants.js';

/**
 * Hub sequences controller — the one thing a page, hook, or another feature
 * (leads' "enroll selection") is allowed to call. Never the gateway
 * directly.
 *
 * Every method is a plain async function taking the caller's `eventEmitter`
 * first and reporting the outcome by emitting an event instead of
 * returning/throwing — try/catch and async/await live here (and in the
 * gateway) only.
 */
async function createSequence(eventEmitter, params) {
  try {
    const sequence = await hubSequencesGateway.createSequence(params);
    eventEmitter.emit(SEQUENCE_EVENTS.CREATE_SEQUENCE_SUCCESS, sequence);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.CREATE_SEQUENCE_FAILURE, error);
  }
}

async function listSequences(eventEmitter) {
  try {
    const sequences = await hubSequencesGateway.listSequences();
    eventEmitter.emit(SEQUENCE_EVENTS.LIST_SEQUENCES_SUCCESS, sequences);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.LIST_SEQUENCES_FAILURE, error);
  }
}

async function getSequence(eventEmitter, id) {
  try {
    const data = await hubSequencesGateway.getSequence(id);
    eventEmitter.emit(SEQUENCE_EVENTS.GET_SEQUENCE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.GET_SEQUENCE_FAILURE, error);
  }
}

async function updateSequence(eventEmitter, id, patch) {
  try {
    const sequence = await hubSequencesGateway.updateSequence(id, patch);
    eventEmitter.emit(SEQUENCE_EVENTS.UPDATE_SEQUENCE_SUCCESS, sequence);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.UPDATE_SEQUENCE_FAILURE, error);
  }
}

async function listEnrollments(eventEmitter, id, options) {
  try {
    const data = await hubSequencesGateway.listEnrollments(id, options);
    eventEmitter.emit(SEQUENCE_EVENTS.LIST_ENROLLMENTS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.LIST_ENROLLMENTS_FAILURE, error);
  }
}

async function enrollLeads(eventEmitter, id, options) {
  try {
    const data = await hubSequencesGateway.enrollLeads(id, options);
    eventEmitter.emit(SEQUENCE_EVENTS.ENROLL_LEADS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.ENROLL_LEADS_FAILURE, error);
  }
}

async function startSequence(eventEmitter, id, accountIds = null) {
  try {
    const sequence = await hubSequencesGateway.startSequence(id, accountIds);
    eventEmitter.emit(SEQUENCE_EVENTS.START_SEQUENCE_SUCCESS, sequence);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.START_SEQUENCE_FAILURE, error);
  }
}

async function pauseSequence(eventEmitter, id) {
  try {
    const sequence = await hubSequencesGateway.pauseSequence(id);
    eventEmitter.emit(SEQUENCE_EVENTS.PAUSE_SEQUENCE_SUCCESS, sequence);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.PAUSE_SEQUENCE_FAILURE, error);
  }
}

async function deleteSequence(eventEmitter, id) {
  try {
    const data = await hubSequencesGateway.deleteSequence(id);
    eventEmitter.emit(SEQUENCE_EVENTS.DELETE_SEQUENCE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.DELETE_SEQUENCE_FAILURE, error);
  }
}

async function previewSequence(eventEmitter, params) {
  try {
    const data = await hubSequencesGateway.previewSequence(params);
    eventEmitter.emit(SEQUENCE_EVENTS.PREVIEW_SEQUENCE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.PREVIEW_SEQUENCE_FAILURE, error);
  }
}

async function rebalanceSequence(eventEmitter, id, params) {
  try {
    const data = await hubSequencesGateway.rebalanceSequence(id, params);
    eventEmitter.emit(SEQUENCE_EVENTS.REBALANCE_SEQUENCE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.REBALANCE_SEQUENCE_FAILURE, error);
  }
}

async function getFlowState(eventEmitter, id) {
  try {
    const data = await hubSequencesGateway.getFlowState(id);
    eventEmitter.emit(SEQUENCE_EVENTS.GET_FLOW_STATE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.GET_FLOW_STATE_FAILURE, error);
  }
}

async function getEnrollment(eventEmitter, id, enrollmentId) {
  try {
    const data = await hubSequencesGateway.getEnrollment(id, enrollmentId);
    eventEmitter.emit(SEQUENCE_EVENTS.GET_ENROLLMENT_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.GET_ENROLLMENT_FAILURE, error);
  }
}

async function retryEnrollment(eventEmitter, id, enrollmentId) {
  try {
    const data = await hubSequencesGateway.retryEnrollment(id, enrollmentId);
    eventEmitter.emit(SEQUENCE_EVENTS.RETRY_ENROLLMENT_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.RETRY_ENROLLMENT_FAILURE, error);
  }
}

async function retryFailed(eventEmitter, id, options) {
  try {
    const data = await hubSequencesGateway.retryFailed(id, options);
    eventEmitter.emit(SEQUENCE_EVENTS.RETRY_FAILED_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.RETRY_FAILED_FAILURE, error);
  }
}

async function duplicateSequence(eventEmitter, id) {
  try {
    const data = await hubSequencesGateway.duplicateSequence(id);
    eventEmitter.emit(SEQUENCE_EVENTS.DUPLICATE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(SEQUENCE_EVENTS.DUPLICATE_FAILURE, error);
  }
}

const sequenceController = {
  createSequence,
  listSequences,
  getSequence,
  updateSequence,
  listEnrollments,
  enrollLeads,
  startSequence,
  pauseSequence,
  deleteSequence,
  previewSequence,
  rebalanceSequence,
  getFlowState,
  getEnrollment,
  retryEnrollment,
  retryFailed,
  duplicateSequence,
};
export default sequenceController;
