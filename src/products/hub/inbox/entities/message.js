/**
 * One inbox message, as the UI reads it. Same pass-through shape as Chat.
 */
export class Message {
  constructor(data = {}) {
    Object.assign(this, data);
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new Message(data) : null;
  }

  static fromList(list = []) {
    return list.map(Message.fromResponse);
  }
}
