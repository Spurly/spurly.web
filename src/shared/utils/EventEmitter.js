/**
 * Minimal dependency-free pub/sub, same shape as Node's EventEmitter
 * (on/off/emit) but built for the browser so controllers can report
 * results by emitting events instead of returning/throwing a promise.
 *
 * One instance per hook/page (create it with `useMemo(() => new
 * EventEmitter(), [])`), passed down to whatever controller call it drives.
 * Listeners are plain functions; `off` removes the exact function reference
 * passed to `on`, so always keep a reference to the handler rather than
 * passing a new arrow function to `on` and a different one to `off`.
 */
export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
    return this;
  }

  /** Subscribe for exactly one firing, then auto-unsubscribe. Use for a
   * single click handler's own response (connect/refresh/disconnect-style
   * calls) rather than a listener that lives for the component's lifetime. */
  once(event, handler) {
    const wrapped = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    this.on(event, wrapped);
    return this;
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
    return this;
  }

  /** Remove every listener, for every event. Not usually needed — each hook
   * owns one instance and just lets it be garbage-collected on unmount. */
  removeAllListeners() {
    this.listeners.clear();
    return this;
  }
}

export default EventEmitter;
