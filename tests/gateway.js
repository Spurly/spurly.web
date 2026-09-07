import { vi } from 'vitest';

/**
 * One stub for the app's single network seam. Tests declare the routes they
 * care about; anything unexpected throws with the offending URL, so a test can
 * never pass on a silently-empty response.
 */
export function stubGateway(routes = {}) {
  const pick = (method, url) => {
    const key = Object.keys(routes).find((k) => {
      const [m, pattern] = k.split(' ');
      return m === method && new RegExp(`^${pattern.replace(/\*/g, '.*')}$`).test(url.split('?')[0]);
    });
    if (!key) throw new Error(`gateway stub: no route for ${method} ${url}`);
    return routes[key];
  };
  /**
   * A route may be a value or a function of the URL. The function form exists
   * for state that CHANGES during a test — a list that is empty on the first
   * poll and populated on the next. Pinning that with a fixed value would mean
   * a separate mock per test and no way to assert the transition at all.
   */
  const respond = (method) => vi.fn(async (url, config) => {
    const route = pick(method, url);
    // Awaited, so a route may return a promise and model a SLOW response.
    // Timing is the whole subject of some bugs: a request that resolves in the
    // same microtask as the one that triggered it cannot reproduce anything
    // that goes wrong while a request is in flight.
    const value = typeof route === 'function' ? await route(url, config) : route;
    return { data: value };
  });
  return {
    default: {
      get: respond('GET'),
      post: respond('POST'),
      put: respond('PUT'),
      patch: respond('PATCH'),
      delete: respond('DELETE'),
      setToken: vi.fn(), removeToken: vi.fn(),
      getToken: () => 'test-token', getBaseUrl: () => 'http://test',
    },
  };
}
