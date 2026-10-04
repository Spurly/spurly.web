// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from 'src/entry-server.jsx';

const ROOT = join(__dirname, '..');
const routesSrc = readFileSync(join(ROOT, 'src', 'app', 'routes.jsx'), 'utf8');
const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

describe('404 page', () => {
  it('renders a useful noindex page for an unknown URL', async () => {
    const { html, head } = await render('/definitely/not/a/page');
    expect(html).toMatch(/<h1[^>]*>That page doesn&#x27;t exist\./);
    expect(html).toContain('href="/blog"');
    expect(html).toContain('href="/support"');
    expect(head).toContain('noindex');
    expect(head).toContain('Page not found');
  });

  it('vercel.json rewrites exactly the app paths to /app (everything else can 404)', () => {
    const rule = vercel.rewrites.find((r) => r.destination === '/app');
    const prefixes = rule.source.match(/^\/\(([^)]+)\)/)[1].split('|');
    const PUBLIC = new Set(['', 'blog', 'privacy', 'terms', 'support', 'book-demo']);
    const first = new Set(
      [...routesSrc.matchAll(/path="\/([^"/:*]*)/g)].map((m) => m[1]),
    );
    for (const seg of first) {
      if (!PUBLIC.has(seg)) expect(prefixes, `app route /${seg} would 404`).toContain(seg);
    }
  });
});
