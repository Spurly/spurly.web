/**
 * A hub inbox conversation, as the UI reads it.
 *
 * Same pass-through shape as the rest of hub's entities (see
 * campaigns/entities/campaign.js) — `_id`, `display`, `lastMessageAt`,
 * `unreadCount`, `backfilledAt` and more are all read directly by the
 * inbox list and thread header today.
 */
function createChat(data = {}) {
  return { ...data, raw: data };
}

export const Chat = {
  fromResponse(data) {
    return data ? createChat(data) : null;
  },
  fromList(list = []) {
    return list.map(Chat.fromResponse);
  },
};
