import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom implements neither of these, and the app's overlays/tables use both.
globalThis.ResizeObserver ??= class {
  observe() {} unobserve() {} disconnect() {}
};
globalThis.matchMedia ??= (query) => ({
  matches: false, media: query, onchange: null,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
});
globalThis.scrollTo ??= () => {};

/**
 * jsdom has no layout, so it implements no scrolling at all — `scrollIntoView`
 * is simply absent, and any component that jumps to the newest item (a message
 * thread, a log tail) throws on mount rather than failing an assertion. Stubbed
 * here rather than guarded at each call site: the gap is the environment's, and
 * a `typeof x === 'function'` check in a component is a test detail leaking
 * into product code.
 */
globalThis.Element.prototype.scrollIntoView ??= () => {};

// Fail a test that fires a real network call instead of letting it hang.
globalThis.fetch ??= vi.fn(() => Promise.reject(new Error('unmocked fetch')));
