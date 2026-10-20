// Signals clip: Profile viewers -> New audience: Import my followers -> Discover posts (select authors, import) -> Discover jobs (who is hiring)
import { installMocks, createState } from '../mocks.mjs';
import { openStudio, Recorder } from '../studio.mjs';
import { extra } from './data.mjs';
const PROBE = process.argv.includes('--probe');
const { browser, page } = await openStudio();
const state = createState();
state.extra = extra;
await installMocks(page, { state });
const rec = new Recorder(page, PROBE ? 'frames/probe' : 'frames/signals', { inflight: () => state.inflight || 0 });
rec.dry = PROBE;
const shot = (n) => PROBE && page.screenshot({ path: `shots/signals-${n}.png`, scale: 'css' });
async function go(path, ready) {
  const was = rec.capturing; rec.capturing = false;
  await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 300; i++) { await rec.frame(); if (i > 20 && (await ready())) break; }
  await rec.wait(300);
  rec.capturing = was;
}
rec.mouse = { x: 1200, y: 300 };
// 1. viewers
await go('/hub/viewers', async () => (await page.getByText('Clara Weiss').count()) > 0);
rec.capturing = true; rec.vt = 0; rec.mark('viewers');
await rec.move(700, 345, 900); await rec.wait(250);
await rec.move(720, 440, 700); await rec.wait(500);
await shot('viewers');
// 2. followers
rec.cut('followers');
await go('/hub/leads', async () => (await page.getByRole('button', { name: 'New audience' }).count()) > 0);
await rec.clickOn(page.getByRole('button', { name: 'New audience' }).first(), { ms: 520 });
await rec.wait(300);
await rec.clickOn(page.getByRole('radio', { name: /Import my followers/ }), { ms: 520, dx: -140 });
rec.mark('followersPicked');
await rec.wait(900);
await shot('followers');
// 3. posts
rec.cut('posts');
await go('/hub/discover', async () => (await page.getByRole('radio', { name: 'Posts' }).count()) > 0);
await rec.clickOn(page.getByRole('radio', { name: 'Posts' }), { ms: 500 });
await rec.wait(200);
const kw = page.locator('form input').first();
await rec.clickOn(kw, { ms: 420, dx: -200 });
await rec.type('outbound', 55);
await rec.wait(120);
await page.keyboard.press('Enter');
rec.mark('postsSearch');
for (let i = 0; i < 120; i++) { await rec.frame(); if (await page.getByText('Daniel Kaya').count()) break; }
rec.mark('postsResults');
await rec.wait(500);
for (const n of ['Daniel Kaya', 'Leah Fischer', 'Isla Morgan']) {
  await rec.clickOn(page.getByRole('checkbox', { name: `Select ${n}` }), { ms: 330 });
  await rec.wait(90);
}
rec.mark('picked');
await rec.wait(250);
const imp = page.getByRole('button', { name: /Import|Add|leads/i }).filter({ hasNotText: 'New audience' }).last();
await shot('posts');
await rec.clickOn(imp, { ms: 450 });
rec.mark('imported');
await rec.wait(900);
await shot('imported');
// 4. jobs
rec.cut('jobs');
await rec.clickOn(page.getByRole('radio', { name: 'Jobs' }), { ms: 520 });
await rec.wait(200);
const kw2 = page.locator('form input').first();
await rec.clickOn(kw2, { ms: 420, dx: -200 });
await rec.type('SDR', 70);
await page.keyboard.press('Enter');
rec.mark('jobsSearch');
for (let i = 0; i < 120; i++) { await rec.frame(); if (await page.getByText('Pinewire Analytics').count()) break; }
rec.mark('jobsResults');
await rec.move(760, 420, 800);
await rec.wait(900);
await shot('jobs');
rec.mark('end');
rec.save();
console.log('frames', rec.n, (rec.n / 60).toFixed(2), JSON.stringify(rec.marks));
await browser.close();
