import hubInvitationsGateway from '../gateway/invitations.js';
import { INVITATIONS_EVENTS as E } from '../constants/constants.js';

/** The one thing the Invitations page and the lead drawer may call: it never lets a call throw into a component. */

function run(eventEmitter, work, success, failure) {
  return work().then(
    (data) => eventEmitter.emit(success, data),
    (error) => eventEmitter.emit(failure, error),
  );
}

const getSent = (em, params) => run(em, () => hubInvitationsGateway.getSent(params), E.GET_SENT_SUCCESS, E.GET_SENT_FAILURE);
const withdraw = (em, invitationId) => run(em, () => hubInvitationsGateway.withdraw(invitationId), E.WITHDRAW_SUCCESS, E.WITHDRAW_FAILURE);
const getReceived = (em, params) => run(em, () => hubInvitationsGateway.getReceived(params), E.GET_RECEIVED_SUCCESS, E.GET_RECEIVED_FAILURE);
const respond = (em, payload) => run(em, () => hubInvitationsGateway.respond(payload), E.RESPOND_SUCCESS, E.RESPOND_FAILURE);
const getRules = (em) => run(em, () => hubInvitationsGateway.getRules(), E.GET_RULES_SUCCESS, E.GET_RULES_FAILURE);
const saveRules = (em, rules) => run(em, () => hubInvitationsGateway.saveRules(rules), E.SAVE_RULES_SUCCESS, E.SAVE_RULES_FAILURE);
const getUsage = (em) => run(em, () => hubInvitationsGateway.getUsage(), E.GET_USAGE_SUCCESS, E.GET_USAGE_FAILURE);
const followLead = (em, leadId) => run(em, () => hubInvitationsGateway.followLead(leadId), E.FOLLOW_SUCCESS, E.FOLLOW_FAILURE);
const getLeadSkills = (em, leadId) => run(em, () => hubInvitationsGateway.getLeadSkills(leadId), E.SKILLS_SUCCESS, E.SKILLS_FAILURE);
const endorseLead = (em, payload) => run(em, () => hubInvitationsGateway.endorseLead(payload), E.ENDORSE_SUCCESS, E.ENDORSE_FAILURE);

const hubInvitationsController = { getSent, withdraw, getReceived, respond, getRules, saveRules, getUsage, followLead, getLeadSkills, endorseLead };
export default hubInvitationsController;
