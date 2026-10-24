import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The live inbox (controller#startLive / stopLive): one shared connection for
 * however many hooks listen, every event fanned out to each, reconnect with
 * backoff after a drop, and no retry loop once signed out.
 */

const streams = [];
vi.mock('src/products/inbox/gateway/inbox.js', () => ({
  default: {
    openLiveStream: (handlers) => {
      const stream = { handlers, closed: false, close() { this.closed = true; } };
      streams.push(stream);
      return stream;
    },
  },
}));

const { default: inboxController } = await import('src/products/inbox/controller/inbox.js');
const { INBOX_EVENTS } = await import('src/products/inbox/constants/constants.js');
const { default: EventEmitter } = await import('src/shared/utils/EventEmitter.js');

function listener() {
  const emitter = new EventEmitter();
  const seen = [];
  emitter.on(INBOX_EVENTS.LIVE_EVENT, (e) => seen.push(e));
  return { emitter, seen };
}

describe('live inbox controller', () => {
  beforeEach(() => { streams.length = 0; vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('shares one connection and fans events out to every listener', () => {
    const list = listener();
    const thread = listener();
    inboxController.startLive(list.emitter);
    inboxController.startLive(thread.emitter);
    expect(streams).toHaveLength(1);

    streams[0].handlers.onOpen();
    streams[0].handlers.onEvent('message', { type: 'message.created', chatId: 'c1', messageId: 'm1' });
    expect(list.seen).toEqual([{ name: 'message', type: 'message.created', chatId: 'c1', messageId: 'm1' }]);
    expect(thread.seen).toHaveLength(1);

    inboxController.stopLive(list.emitter);
    expect(streams[0].closed).toBe(false);
    inboxController.stopLive(thread.emitter);
    expect(streams[0].closed).toBe(true);
  });

  it('reconnects after a drop, with backoff', () => {
    const a = listener();
    inboxController.startLive(a.emitter);
    streams[0].handlers.onClose({ status: 502 });
    expect(streams).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(streams).toHaveLength(2);
    streams[1].handlers.onClose();
    vi.advanceTimersByTime(1999);
    expect(streams).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(streams).toHaveLength(3);
    inboxController.stopLive(a.emitter);
  });

  it('does not retry once signed out or without access', () => {
    const a = listener();
    inboxController.startLive(a.emitter);
    streams[0].handlers.onClose({ status: 401 });
    vi.advanceTimersByTime(60_000);
    expect(streams).toHaveLength(1);
    inboxController.stopLive(a.emitter);
  });
});
