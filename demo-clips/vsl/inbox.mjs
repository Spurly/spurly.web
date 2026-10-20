// Inbox + dashboard clip: inbox list -> open Harriet's reply -> type an answer -> Dashboard analytics
import { installMocks, createState } from '../mocks.mjs';
import { openStudio, Recorder } from '../studio.mjs';
import { extra } from './data.mjs';
const PROBE = process.argv.includes('--probe');
const { browser, page } = await openStudio();
const state = createState();
state.extra = extra;
await installMocks(page, { state });
const rec = new Recorder(page, PROBE ? 'frames/probe' : 'frames/inbox', { inflight: () => state.inflight || 0 });
rec.dry = PROBE;
const shot = (n) => PROBE && page.screenshot({ path: `shots/inbox-${n}.png`, scale: 'css' });
async function go(path, ready) {
  const was = rec.capturing; rec.capturing = false;
  await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 300; i++) { await rec.frame(); if (i > 20 && (await ready())) break; }
  await rec.wait(300);
  rec.capturing = was;
}
rec.mouse = { x: 900, y: 500 };
await go('/hub/inbox', async () => (await page.getByText('Harriet Cole').count()) > 0);
rec.capturing = true; rec.vt = 0; rec.mark('inbox');
await rec.wait(300);
await rec.clickOn(page.getByText('Harriet Cole').first(), { ms: 650 });
rec.mark('open');
for (let i = 0; i < 90; i++) { await rec.frame(); if (await page.getByText('Thursday works').count() > 1) break; }
await rec.wait(500);
const box = page.locator('textarea').last();
await rec.clickOn(box, { ms: 500, dx: -150 });
await rec.type('Perfect. Thursday 3pm, here is the link.', 38);
rec.mark('typed');
await rec.wait(700);
await shot('thread');
rec.cut('dash');
await go('/hub/dashboard', async () => (await page.getByText('Good morning', { exact: false }).count()) > 0);
await rec.wait(400);
await rec.move(1100, 600, 400);
for (let i = 0; i < 66; i++) { const u = (i + 1) / 66, e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, p = i / 66, ep = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; await page.mouse.wheel(0, (e - ep) * 760); await rec.frame(); }
rec.mark('analytics');
await rec.wait(1600);
await shot('dash');
rec.mark('end');
rec.save();
console.log('frames', rec.n, (rec.n / 60).toFixed(2), JSON.stringify(rec.marks));
await browser.close();
