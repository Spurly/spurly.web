// @vitest-environment node
/**
 * The public website is prerendered at build time (scripts/prerender.mjs ->
 * src/entry-server.jsx). These pin what that output must contain, because a
 * regression here is invisible in the browser — the page still looks fine once
 * JS runs — and only shows up weeks later as pages dropping out of Google or
 * LinkedIn previews showing the wrong card.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, PUBLIC_ROUTES, SITE_URL } from 'src/entry-server.jsx';

const ROUTES_SRC = readFileSync(join(__dirname, '..', 'src', 'app', 'routes.jsx'), 'utf8');

describe('public website prerender', () => {
  it('lists only paths that routes.jsx actually serves', () => {
    for (const { path } of PUBLIC_ROUTES) {
      expect(ROUTES_SRC, `routes.jsx has no <Route path="${path}">`).toContain(`path="${path}"`);
    }
  });

  it.each(PUBLIC_ROUTES.map((r) => [r.path]))(
    '%s renders real content with its own head tags',
    async (path) => {
      const { html, head } = await render(path);
      const canonical = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;

      // The page itself, not the lazy-route spinner.
      expect(html).toMatch(/<h1[\s>]/);
      // Its own tags, not the homepage defaults from index.html.
      expect(head).toContain(`<link data-rh="true" rel="canonical" href="${canonical}"`);
      expect(head).toContain(`property="og:url" content="${canonical}"`);
      expect(head).toMatch(/<title[^>]*>[^<]+<\/title>/);
      expect(head).toMatch(/name="description" content="[^"]{50,}"/);
    },
  );

  it('gives every public page a distinct title', async () => {
    const titles = await Promise.all(
      PUBLIC_ROUTES.map(async ({ path }) => (await render(path)).head.match(/<title[^>]*>([^<]+)</)[1]),
    );
    expect(new Set(titles).size).toBe(titles.length);
  });
});
