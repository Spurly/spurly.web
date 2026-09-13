/**
 * A hub inbox conversation, as the UI reads it.
 *
 * Same pass-through shape as the rest of hub's entities (see
 * campaigns/entities/campaign.js) — `_id`, `display`, `lastMessageAt`,
 * `unreadCount`, `backfilledAt` and more are all read directly by the
 * inbox list and thread header today.
 */
export class Chat {
  constructor(data = {}) {
    Object.assign(this, data);
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new Chat(data) : null;
  }

  static fromList(list = []) {
    return list.map(Chat.fromResponse);
  }
}
