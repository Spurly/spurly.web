import hubInboxGateway from '../gateway/inbox.js';

/**
 * Hub inbox controller — the one thing a page or hook is allowed to call.
 * Never the gateway directly. Pure pass-through today, same reasoning as
 * every other hub controller (see campaigns/controller/campaign.js).
 */
class InboxController {
  getSummary() {
    return hubInboxGateway.getSummary();
  }

  listChats(params) {
    return hubInboxGateway.listChats(params);
  }

  getThread(id, options) {
    return hubInboxGateway.getThread(id, options);
  }

  markRead(id) {
    return hubInboxGateway.markRead(id);
  }

  sync() {
    return hubInboxGateway.sync();
  }

  sendReply(id, text) {
    return hubInboxGateway.sendReply(id, text);
  }
}

export const inboxController = new InboxController();
export default inboxController;
