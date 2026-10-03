// @vitest-environment node
/**
 * What the prerendered public pages must NOT say, and what the home page must
 * say about price. These claims were wrong once (SEO_CONTENT_PLAN §1) and a
 * regression is invisible in the browser, so they are pinned on the HTML.
 */
import { describe, it, expect } from 'vitest';
import { render, PUBLIC_ROUTES, ogSlug } from 'src/entry-server.jsx';

const BANNED = [/local-only/i, /never leaves your/i, /100% local/i, /no credit card/i, /Start free\b/, /\bSessions?\b/];
// Privacy and Terms are legal text awaiting the v2 rewrite (they still carry
// the old wording); only the trial claim is checked there.
const LEGAL = new Set(['/privacy', '/terms']);

describe('public pages: no outdated claims', () => {
  it.each(PUBLIC_ROUTES.map((r) => [r.path]))('%s', async (path) => {
    const { html, head } = await render(path);
    const text = html + head;
    const banned = LEGAL.has(path) ? [/no credit card/i] : BANNED;
    for (const re of banned) expect(text, `${path} matches ${re}`).not.toMatch(re);
  });

  it('the home page prerenders the USD price and the exact trial copy', async () => {
    const { html, head } = await render('/');
    expect(html).toContain('$24.99');
    expect(html).not.toContain('₹');
    expect(html).toContain("You won&#x27;t be charged until day 8");
    // structured data carries both real offers
    expect(head).toContain('"price":"24.99"');
    expect(head).toContain('"price":"2499"');
    expect(head).toContain('"eligibleRegion":"IN"');
  });
});

describe('home structured data', () => {
  it('describes Organization and the SoftwareApplication with real, parseable JSON-LD', async () => {
    const { head } = await render('/');
    const blocks = [...head.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')));
    const org = blocks.find((b) => b['@type'] === 'Organization');
    const app = blocks.find((b) => b['@type'] === 'SoftwareApplication');
    expect(org.sameAs).toContain('https://www.linkedin.com/company/spurly/');
    expect(org.foundingDate).toBe('2026');
    expect(org.description).toBeTruthy();
    expect(app.applicationCategory).toBe('BusinessApplication');
    expect(app.operatingSystem).toBe('Chrome');
    expect(app.offers.map((o) => o.priceCurrency).sort()).toEqual(['INR', 'USD']);
  });
});

describe('Open Graph cards', () => {
  it.each(PUBLIC_ROUTES.map((r) => [r.path]))('%s points at its own generated card', async (path) => {
    const { head } = await render(path);
    expect(head).toContain(`property="og:image" content="https://www.getspurly.com/og/${ogSlug(path)}.png"`);
    expect(head).toContain(`name="twitter:image" content="https://www.getspurly.com/og/${ogSlug(path)}.png"`);
  });

  it('gives every route a distinct card name', () => {
    const slugs = PUBLIC_ROUTES.map((r) => ogSlug(r.path));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
