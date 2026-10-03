// @vitest-environment node
/**
 * The six page templates, rendered from fixture frontmatter + blocks so they are
 * covered before any real page uses them. Pins the T2.2 contract: one H1,
 * breadcrumbs (+BreadcrumbList), last updated, CTA after each main section,
 * FAQ (+FAQPage), author box, related pages, and the exact trial copy.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { parseContentFile } from '../scripts/contentParser.mjs';
import { CONTENT_META } from 'src/products/pages/website/content/content.meta.generated.js';
import { CONTENT_BODIES } from 'src/products/pages/website/content/content.bodies.generated.js';
import { PUBLIC_ROUTES } from 'src/products/pages/website/seo.js';
import { TRIAL_NOTE } from 'src/products/pages/website/pricing.js';
import ArticleTemplate from 'src/products/pages/website/templates/ArticleTemplate.jsx';
import ProductTemplate from 'src/products/pages/website/templates/ProductTemplate.jsx';
import SolutionsTemplate from 'src/products/pages/website/templates/SolutionsTemplate.jsx';
import ComparisonTemplate from 'src/products/pages/website/templates/ComparisonTemplate.jsx';
import PricingTemplate from 'src/products/pages/website/templates/PricingTemplate.jsx';
import ToolTemplate from 'src/products/pages/website/templates/ToolTemplate.jsx';
import PageTemplate from 'src/products/pages/website/templates/PageTemplate.jsx';

const COMPARE = `checked: 2026-10-03
sources:
  - name: Vendor pricing page
    url: https://example.com/pricing
`;

function fixture(template, path, extra = '') {
  return parseContentFile(`---
title: Fixture ${template}
description: A fixture page used to test the ${template} template end to end.
path: ${path}
template: ${template}
date: 2026-09-01
updated: 2026-10-03
author: sarthak
related: [${CONTENT_META[0].path}]
faq:
  - q: Does it work?
    a: Yes, it works.
${extra}---
Intro paragraph.

## First section
Body one.

## Second section
Body two.

## Third section
Body three.
`, `${template}.md`);
}

function html(Template, { meta, body }) {
  const helmetContext = {};
  const out = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={meta.path}><Template meta={meta} body={body} /></StaticRouter>
    </HelmetProvider>,
  );
  const h = helmetContext.helmet;
  return { html: out, head: [h.title, h.meta, h.link, h.script].map((t) => t.toString()).join('\n') };
}

const CASES = [
  ['product', ProductTemplate, '/product/fixture', '', 'Product'],
  ['solutions', SolutionsTemplate, '/solutions/fixture', '', 'Solutions'],
  ['comparison', ComparisonTemplate, '/compare/fixture', COMPARE, 'Compare'],
  ['pricing', PricingTemplate, '/pricing-fixture', '', 'Pricing'],
  ['tool', ToolTemplate, '/tools/fixture', '', 'Free tool'],
  ['page', PageTemplate, '/fixture', '', null],
];

describe.each(CASES)('%s template', (name, Template, path, extra, eyebrow) => {
  const { html: out, head } = html(Template, fixture(name, path, extra));

  it('has exactly one H1, breadcrumbs, last updated and the FAQ', () => {
    expect(out.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(out).toContain('aria-label="Breadcrumb"');
    expect(out).toContain('Last updated');
    expect(out).toContain('<h3>Does it work?</h3>');
    expect(head).toContain('BreadcrumbList');
    expect(head).toContain('FAQPage');
    expect(head).toContain('"@type":"WebPage"');
  });

  it('ends with the CTA, the exact trial copy, the author box and related pages', () => {
    expect(out).toContain('Start 7-day free trial');
    expect(out.replace(/&#x27;/g, "'")).toContain(TRIAL_NOTE);
    expect(out).toContain('About the author');
    expect(out).toContain(CONTENT_META[0].title.replace(/&/g, '&amp;'));
  });

  it(eyebrow ? `shows the "${eyebrow}" eyebrow` : 'has no eyebrow', () => {
    if (eyebrow) expect(out).toContain(`<p class="eyebrow">${eyebrow}</p>`);
    else expect(out).not.toContain('class="eyebrow"');
  });

  it('puts a CTA after each main section except the last', () => {
    const inline = (out.match(/class="inline-cta"/g) || []).length;
    expect(inline).toBe(name === 'page' || name === 'pricing' || name === 'tool' ? 0 : 2);
  });
});

describe('template specifics', () => {
  it('comparison shows its sources and the date checked', () => {
    const { html: out } = html(ComparisonTemplate, fixture('comparison', '/compare/fixture', COMPARE));
    expect(out).toContain('Sources and date checked');
    expect(out).toContain('href="https://example.com/pricing"');
    expect(out).toContain('October 3, 2026');
  });

  it('comparison without sources or a date is rejected', () => {
    expect(() => fixture('comparison', '/compare/x')).toThrow(/checked/);
    expect(() => fixture('comparison', '/compare/x', 'checked: 2026-10-03\n')).toThrow(/sources/);
  });

  it('pricing shows the plan card and the SoftwareApplication offers', () => {
    const { html: out, head } = html(PricingTemplate, fixture('pricing', '/pricing-fixture'));
    expect(out).toContain('$24.99');
    expect(out).toContain('7-day free trial');
    expect(head).toContain('SoftwareApplication');
    expect(head).toContain('2499');
  });

  it('article shows author, FAQ and the trial note, and credits a Person', () => {
    const { html: out, head } = html(ArticleTemplate, fixture('article', '/blog/fixture'));
    expect(out).toContain('About the author');
    expect(out).toContain('<h3>Does it work?</h3>');
    expect(head).toContain('"author":{"@type":"Person","name":"Sarthak Vats"');
    expect(head).toContain('linkedin.com/in/sarthak-vats-793128226');
    expect(out.replace(/&#x27;/g, "'")).toContain(TRIAL_NOTE);
  });

  it('article without an author is credited to the organisation', () => {
    const f = fixture('article', '/blog/fixture');
    delete f.meta.author;
    const { head } = html(ArticleTemplate, f);
    expect(head).toContain('"author":{"@type":"Organization","name":"Spurly"}');
  });
});

describe('internal links in shipped content', () => {
  it('only point at pages that exist', () => {
    const known = new Set([...PUBLIC_ROUTES.map((r) => r.path), '/signup', '/login']);
    const bad = [];
    for (const p of CONTENT_META) {
      for (const r of p.related || []) if (!known.has(r)) bad.push(`${p.path} related -> ${r}`);
    }
    expect(bad).toEqual([]);
  });

  it('inside page bodies and FAQs point at pages that exist', () => {
    const known = new Set([...PUBLIC_ROUTES.map((r) => r.path), '/signup', '/login']);
    const links = (nodes) => nodes.flatMap((n) => (typeof n === 'string' ? [] : n.t === 'link' ? [n.href, ...links(n.children)] : n.children ? links(n.children) : []));
    const bad = [];
    for (const [path, blocks] of Object.entries(CONTENT_BODIES)) {
      for (const b of blocks) {
        const nodes = [b.inline, ...(b.items || []), ...(b.head || []), ...(b.rows || []).flat()].filter(Boolean).flatMap((x) => (Array.isArray(x[0]) ? x.flat() : x));
        for (const href of links(nodes.flat())) {
          if (!href.startsWith('/') || href.startsWith('/#')) continue; // external or home anchor
          if (!known.has(href.split('#')[0])) bad.push(`${path} -> ${href}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
