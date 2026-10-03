// @vitest-environment node
/** A 401 on a public marketing page must not bounce the visitor (or Googlebot)
 *  to /login, which carries noindex. Every public route has to be allow-listed. */
import { describe, it, expect } from 'vitest';
import { PUBLIC_ROUTES } from 'src/entry-server.jsx';
import { isPublicPath } from 'src/shared/gateway/apiGateway.js';

describe('apiGateway public paths', () => {
  it.each(PUBLIC_ROUTES.map((r) => [r.path]))('%s is public', (path) => {
    expect(isPublicPath(path)).toBe(true);
  });
  it('still protects the app', () => {
    for (const p of ['/dashboard', '/hub/inbox', '/subscribe', '/onboarding', '/admin']) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});
