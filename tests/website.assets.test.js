// @vitest-environment node
/** Every local image the public site references must exist in public/, and the
 *  people pages must carry the real author data. */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render } from 'src/entry-server.jsx';

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'src/products/pages/website');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

describe('local assets', () => {
  it('every /assets/... reference in the website folder exists in public/', () => {
    const files = walk(SITE).filter((f) => /\.(md|jsx?|css)$/.test(f) && !/generated/.test(f));
    const missing = [];
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(/\/assets\/[A-Za-z0-9_.-]+\.(?:webp|png|jpg|svg)/g)) {
        if (!fs.existsSync(path.join(ROOT, 'public', m[0]))) missing.push(path.relative(ROOT, f) + ' -> ' + m[0]);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('people and trust pages', () => {
  it('/about carries a Person entity with the LinkedIn profile', async () => {
    const { head, html } = await render('/about');
    expect(head).toContain('"@type":"Person"');
    expect(head).toContain('linkedin.com/in/sarthak-vats-793128226');
    expect(html).toContain('Sarthak Vats');
  });
  it('/security and the author page prerender', async () => {
    expect((await render('/security')).html).toContain('Security and data handling');
    expect((await render('/blog/author/sarthak')).html).toContain('Posts by Sarthak');
  });
  it('the home page shows the AI section and the video placeholder', async () => {
    const { html } = await render('/');
    expect(html).toContain('AI that writes the outreach');
    expect(html).toContain('Video tour coming soon');
  });
});
