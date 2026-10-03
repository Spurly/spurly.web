// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_ROUTES } from 'src/products/pages/website/seo.js';
import { PAGE_UPDATED } from 'src/products/pages/website/pageDates.js';
import { POSTS } from 'src/products/pages/website/blogPosts.js';

describe('sitemap lastmod comes from content dates, never the build date', () => {
  it('every route has a real, non-future YYYY-MM-DD date', () => {
    // +1 day of slack: the author may be a timezone ahead of the machine running the test.
    const limit = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    for (const r of PUBLIC_ROUTES) {
      expect(r.lastmod, r.path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.lastmod <= limit, `${r.path} lastmod is in the future`).toBe(true);
    }
  });

  it('each lastmod equals the page\'s declared content date', () => {
    for (const r of PUBLIC_ROUTES) {
      const post = POSTS.find((p) => '/blog/' + p.slug === r.path);
      if (post) expect(r.lastmod).toBe(post.updated || post.date);
      else if (r.path !== '/blog') expect(r.lastmod).toBe(PAGE_UPDATED[r.path]);
    }
  });

  it('the route list never calls new Date() (that would be the build date)', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'products', 'pages', 'website', 'seo.js'), 'utf8');
    expect(src).not.toMatch(/new Date\(|Date\.now\(/);
  });
});
