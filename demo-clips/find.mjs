// Find clip — New audience → Build from filters → Review → Run import → leads fill in.
// Renders frames into frames/find (2x, 60 fps, virtual time). Camera + encode: camera.py find shots-find.json.
import { installMocks, createState, IMPORTED, EXISTING } from './mocks.mjs';
import { openStudio, Recorder } from './studio.mjs';

const { browser, page } = await openStudio();
const state = createState();
let rec;
let t0 = null;
const progress = () => (t0 == null ? 0 : Math.max(0, Math.min(IMPORTED.length, Math.floor((rec.vt - t0 - 350) / 170))));
state.onCreate = (s) => { t0 = rec.vt; s.status = 'running'; };
Object.defineProperty(state, 'leads', { get: () => [...IMPORTED.slice(0, progress()).reverse(), ...EXISTING], set() {} });
const searches = [];
Object.defineProperty(state, 'searches', {
  get: () => searches.map((s) => ({ ...s, fetchNew: progress(), importedCount: progress() })),
  set(v) { searches.splice(0, searches.length, ...v); },
});
await installMocks(page, { state });
// The app polls every 5 s while an import runs; on the demo clock it polls every 0.5 s.
await page.addInitScript(() => {
  const si = window.setInterval;
  window.setInterval = (fn, d, ...a) => si(fn, d === 5000 ? 500 : d, ...a);
});

rec = new Recorder(page, 'frames/find', { inflight: () => state.inflight || 0 });
await page.goto('http://localhost:3000/hub/leads', { waitUntil: 'domcontentloaded' });
rec.mouse = { x: 1300, y: 64 };
// warm up off camera until the table has rows and logos
for (let i = 0; i < 200; i++) {
  await rec.frame();
  if (i > 40 && (await page.locator('img[src*="logo.dev"]').count()) >= 8) break;
}
await rec.wait(400);

rec.capturing = true;
rec.vt = 0;
rec.mark('start');
await rec.wait(350);

// 1. New audience
await rec.clickOn(page.getByRole('button', { name: 'New audience' }).first(), { ms: 560 });
rec.mark('open');
await rec.wait(320);
const dialog = page.getByRole('dialog');
await rec.rect('source', dialog);

// 2. Source → Build from filters
await rec.clickOn(page.getByRole('radio', { name: /Build from filters/ }), { ms: 500, dx: -140 });
await rec.wait(260);
await rec.clickOn(page.getByRole('button', { name: 'Continue' }), { ms: 480 });
rec.mark('review');
await rec.wait(300);
await rec.rect('review', dialog);
await rec.rect('title', dialog.locator('#audience-title'));

// 3. Review — LinkedIn's own filters, picked from its id lookup
await rec.clickOn(dialog.locator('input[placeholder="Search a city or region…"]'), { ms: 460, dx: -70 });
await rec.type('Berl', 70);
const locOpt = page.getByRole('button', { name: 'Berlin, Germany' });
await rec.waitFor(locOpt);
await rec.wait(170);
await rec.clickOn(locOpt, { ms: 320, dx: -55 });
await rec.wait(180);

await rec.clickOn(dialog.locator('input[placeholder="Search an industry…"]'), { ms: 460, dx: -70 });
await rec.type('Logist', 62);
const indOpt = page.getByRole('button', { name: /Transportation, Logistics/ });
await rec.waitFor(indOpt);
await rec.wait(170);
await rec.clickOn(indOpt, { ms: 320, dx: -80 });
await rec.wait(180);

await rec.clickOn(dialog.getByRole('button', { name: '2nd', exact: true }), { ms: 460 });
await rec.wait(150);
await rec.clickOn(dialog.locator('#audience-title'), { ms: 440, dx: -60 });
await rec.type('Head of Operations', 34);
rec.mark('filled');
await rec.wait(220);

await rec.clickOn(page.getByRole('button', { name: 'Continue' }), { ms: 520 });
rec.mark('run');
await rec.wait(300);
await rec.rect('run', dialog);
await rec.wait(420);

// 4. Run import → the table fills while the import runs in the background
await rec.clickOn(page.getByRole('button', { name: 'Run import' }), { ms: 420 });
rec.mark('submitted');
await rec.wait(250);
await rec.move(1330, 66, 700);
await rec.wait(1800);
rec.mark('end');
await rec.wait(300);

rec.save();
console.log('frames', rec.n, 'seconds', (rec.n / 60).toFixed(2), rec.marks);
await browser.close();
