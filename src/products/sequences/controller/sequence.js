import hubSequencesGateway from '../gateway/sequence.js';

/**
 * Hub sequences controller — the one thing a page, hook, or another feature
 * (leads' "enroll selection") is allowed to call. Never the gateway
 * directly.
 *
 * Pure pass-through today, same reasoning as CampaignController and
 * LeadController.
 */
class SequenceController {
  createSequence(params) {
    return hubSequencesGateway.createSequence(params);
  }

  listSequences() {
    return hubSequencesGateway.listSequences();
  }

  getSequence(id) {
    return hubSequencesGateway.getSequence(id);
  }

  updateSequence(id, patch) {
    return hubSequencesGateway.updateSequence(id, patch);
  }

  listEnrollments(id, options) {
    return hubSequencesGateway.listEnrollments(id, options);
  }

  enrollLeads(id, options) {
    return hubSequencesGateway.enrollLeads(id, options);
  }

  startSequence(id) {
    return hubSequencesGateway.startSequence(id);
  }

  pauseSequence(id) {
    return hubSequencesGateway.pauseSequence(id);
  }

  deleteSequence(id) {
    return hubSequencesGateway.deleteSequence(id);
  }
}

export const sequenceController = new SequenceController();
export default sequenceController;
