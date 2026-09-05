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
  const respond = (method) => vi.fn(async (url) => ({ data: pick(method, url) }));
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
