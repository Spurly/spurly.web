// @vitest-environment node
/**
 * The content system: a .md file under content/ becomes a prerendered page and a
 * sitemap entry with no JSX. The parser is pure, so it is tested directly; the
 * generated modules and the real prerender are checked against the shipped files.
 */
import { describe, it, expect } from 'vitest';
import { parseContentFile, parseInline, parseBlocks, parseFrontmatter } from '../scripts/contentParser.mjs';
import { CONTENT_META } from 'src/products/pages/website/content/content.meta.generated.js';
import { CONTENT_BODIES } from 'src/products/pages/website/content/content.bodies.generated.js';
import { PUBLIC_ROUTES } from 'src/products/pages/website/seo.js';
import { render } from 'src/entry-server.jsx';

const FILE = (extra = '', body = 'Hello **world**.') => `---
title: A page
description: About a page
path: /blog/a-page
template: article
date: 2026-10-01
${extra}---
${body}
`;

describe('content parser', () => {
  it('reads frontmatter scalars, inline arrays and faq lists', () => {
    const fm = parseFrontmatter(`title: "Hi: there"\ndraft: true\ntags: [a, b]\nfaq:\n  - q: One?\n    a: Yes.\n  - q: Two?\n    a: No.`);
    expect(fm).toEqual({ title: 'Hi: there', draft: true, tags: ['a', 'b'], faq: [{ q: 'One?', a: 'Yes.' }, { q: 'Two?', a: 'No.' }] });
  });

  it('parses inline marks and links', () => {
    expect(parseInline('a **b** *c* `d` [e](/x)')).toEqual([
      'a ', { t: 'strong', children: ['b'] }, ' ', { t: 'em', children: ['c'] }, ' ', { t: 'code', text: 'd' }, ' ', { t: 'link', href: '/x', children: ['e'] },
    ]);
  });

  it('parses headings, lists, tables, quotes and images', () => {
    const blocks = parseBlocks('## Why it works\n\n- one\n- two\n\n1. a\n2. b\n\n| Tool | Price |\n|---|---|\n| X | $1 |\n\n> quoted\n\n![alt text](/assets/x.webp)\n');
    expect(blocks.map((b) => b.type)).toEqual(['h2', 'ul', 'ol', 'table', 'quote', 'image']);
    expect(blocks[0].id).toBe('why-it-works');
    expect(blocks[3].rows).toHaveLength(1);
  });

  it('gives duplicate headings distinct ids', () => {
    const ids = parseBlocks('## Same\n\n## Same\n').map((b) => b.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('computes updated and readTime, and defaults updated to date', () => {
    const { meta } = parseContentFile(FILE());
    expect(meta.updated).toBe('2026-10-01');
    expect(meta.readTime).toMatch(/min read$/);
  });

  it.each([
    ['missing frontmatter', 'no frontmatter', /frontmatter/],
    ['missing required field', FILE().replace('description: About a page\n', ''), /"description"/],
    ['bad template', FILE().replace('article', 'blogpost'), /template/],
    ['bad path', FILE().replace('/blog/a-page', 'Blog/A Page'), /path/],
    ['bad date', FILE().replace('2026-10-01', '1 Oct'), /YYYY-MM-DD/],
    ['raw html', FILE('', '<div>x</div>'), /raw HTML/],
    ['an H1 in the body', FILE('', '# Title'), /H1/],
    ['faq item without answer', FILE('faq:\n  - q: Only a question\n'), /faq/],
  ])('rejects %s', (_name, text, re) => {
    expect(() => parseContentFile(text, 't.md')).toThrow(re);
  });
});

describe('shipped content files', () => {
  it('every page has a body, a unique path, and is a public route', () => {
    expect(CONTENT_META.length).toBeGreaterThanOrEqual(3);
    expect(new Set(CONTENT_META.map((p) => p.path)).size).toBe(CONTENT_META.length);
    for (const p of CONTENT_META) {
      expect(CONTENT_BODIES[p.path]?.length, p.path).toBeGreaterThan(0);
      expect(PUBLIC_ROUTES.some((r) => r.path === p.path), p.path).toBe(true);
    }
  });

  it('keeps the three blog post URLs unchanged', () => {
    const paths = CONTENT_META.map((p) => p.path);
    for (const slug of ['personalize-linkedin-connection-requests', 'free-linkedin-outreach-pipeline-founders', 'sales-navigator-candidate-pipelines-recruiters']) {
      expect(paths).toContain('/blog/' + slug);
    }
  });

  it.each(CONTENT_META.map((p) => [p.path]))('%s prerenders from its file', async (path) => {
    const meta = CONTENT_META.find((p) => p.path === path);
    const { html, head } = await render(path);
    expect(html).toContain(`<h1 class="h1">`);
    expect(html).toContain(meta.title.replace(/&/g, '&amp;'));
    expect(head).toContain('application/ld+json');
    expect(head).toContain(`rel="canonical" href="https://www.getspurly.com${path}"`);
    if (meta.faq) expect(head).toContain('FAQPage');
  });

  it('never ships the banned claims', () => {
    const text = JSON.stringify(CONTENT_BODIES) + JSON.stringify(CONTENT_META);
    const hit = text.match(/no credit card|local-only|never leaves your device|100% local|free plan/i);
    expect(hit && hit[0]).toBeNull(); // prints the phrase, not the whole corpus
  });
});

describe('/pricing page', () => {
  it('is the pricing template and carries the real prices and the exact trial copy', async () => {
    const meta = CONTENT_META.find((p) => p.path === '/pricing');
    expect(meta.template).toBe('pricing');
    const { html, head } = await render('/pricing');
    const text = html.replace(/&#x27;/g, "'");
    expect(text).toContain('$24.99');
    expect(text).toContain('₹2,499');
    expect(text).toContain("Add a card (or UPI in India) to start your 7-day free trial. You won't be charged until day 8. Cancel anytime before then and you pay nothing.");
    expect(text).toContain('Settings → Billing → Cancel');
    expect(head).toContain('SoftwareApplication');
    expect(head).toContain('FAQPage');
    expect(text).not.toMatch(/reminder email|refund|invoice|gst/i);
  });
});
