/**
 * One inbox message, as the UI reads it. Same pass-through shape as Chat.
 */
function createMessage(data = {}) {
  return { ...data, raw: data };
}

export const Message = {
  fromResponse(data) {
    return data ? createMessage(data) : null;
  },
  fromList(list = []) {
    return list.map(Message.fromResponse);
  },
};
