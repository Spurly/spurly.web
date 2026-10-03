// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const text = readFileSync(join(__dirname, '..', 'public', 'robots.txt'), 'utf8');

/** { 'gptbot': { allow: [...], disallow: [...] }, ... } — one entry per user-agent group. */
function parse(src) {
  const groups = {};
  let current = [];
  let sawRule = false;
  for (const raw of src.split('\n')) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const [k, ...rest] = line.split(':');
    const key = k.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      if (sawRule) { current = []; sawRule = false; }
      current.push(value.toLowerCase());
      current.forEach((ua) => { groups[ua] ??= { allow: [], disallow: [] }; });
    } else if (key === 'allow' || key === 'disallow') {
      sawRule = true;
      current.forEach((ua) => groups[ua][key].push(value));
    }
  }
  return groups;
}

const BOTS = ['gptbot', 'oai-searchbot', 'chatgpt-user', 'claudebot', 'perplexitybot', 'google-extended', 'bingbot'];
const APP = ['/dashboard', '/hub', '/admin', '/onboarding', '/subscribe', '/dev'];

describe('robots.txt', () => {
  const groups = parse(text);

  it.each([...BOTS, '*'])('%s may crawl the site but not the app', (bot) => {
    expect(groups[bot], `no group for ${bot}`).toBeDefined();
    expect(groups[bot].allow).toContain('/');
    for (const p of APP) expect(groups[bot].disallow).toContain(p);
  });

  it('lists the sitemap', () => {
    expect(text).toContain('Sitemap: https://www.getspurly.com/sitemap.xml');
  });
});
