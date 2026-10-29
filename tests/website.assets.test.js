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
  it('the home page states what Spurly is and repeats one primary CTA', async () => {
    const { html } = await render('/');
    expect(html).toContain('AI SDR</em>');
    expect(html).toContain('LinkedIn leads.');
    expect(html).toContain('On autopilot.');
    expect(html).toContain('Spurly is a LinkedIn automation tool that finds your ideal prospects');
    expect(html).toContain('LinkedIn automation');
    expect(html).toContain('Spurly is an AI SDR for LinkedIn');
    // the hero shows the demo video as a click-to-play poster (nothing loads before the click)
    expect(html).toContain('Play: Spurly in 4 minutes');
    expect(html).toContain('/assets/video/spurly-vsl-poster.webp');
    expect(html).not.toContain('spurly-vsl.mp4');
    // sections: features band, intent signals grid, pricing, FAQ, final CTA
    expect(html).toContain('Every SDR job on LinkedIn');
    expect(html).toContain('intent signals tracked');
    expect(html).toContain('everything included');
    expect(html).toContain('Before you book, ');
    // hero + plan card + final CTA (the top bar has no CTA button); no trial wording anywhere
    expect(html.split('Get started').length - 1).toBeGreaterThanOrEqual(3);
    expect(html).not.toContain('Start 7-day free trial');
    // the long sections moved to their own pages
    expect(html).not.toContain('Video tour coming soon');
  });
});
