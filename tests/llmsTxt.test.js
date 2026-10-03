// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildLlmsTxt, decodeHtml } from '../scripts/llmsTxt.mjs';
import { PUBLIC_ROUTES, SITE_URL } from 'src/products/pages/website/seo.js';

describe('llms.txt', () => {
  const pages = PUBLIC_ROUTES.map((r) => ({ path: r.path, title: `Title ${r.path}`, description: `About ${r.path}` }));
  const txt = buildLlmsTxt(SITE_URL, pages);

  it('starts with the site name and a one-paragraph summary', () => {
    expect(txt.startsWith('# Spurly\n\n> Spurly runs your LinkedIn outreach')).toBe(true);
    expect(txt).toContain('$24.99/month (₹2,499/month in India)');
    expect(txt).not.toMatch(/no credit card|local-only|free plan/i);
  });

  it('links every public route exactly once', () => {
    for (const { path } of PUBLIC_ROUTES) {
      const url = path === '/' ? SITE_URL + '/' : SITE_URL + path;
      expect(txt.split(`](${url})`).length - 1, url).toBe(1);
    }
  });

  it('decodes the entities Helmet writes', () => {
    expect(decodeHtml('Tom &amp; Jerry&#x27;s &quot;x&quot;')).toBe('Tom & Jerry\'s "x"');
  });
});
