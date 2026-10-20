// node vsl/probe.mjs /hub/viewers name   -> shots/vsl-name.png and a list of API calls
import { installMocks, createState } from '../mocks.mjs';
import { openStudio } from '../studio.mjs';
import { extra } from './data.mjs';
const [path, name = 'probe'] = process.argv.slice(2);
const { browser, page } = await openStudio();
const state = createState();
const calls = [];
state.extra = (m, p, url, json) => { const r = extra(m, p, url, json); calls.push((r ? 'OK ' : '-- ') + m + ' ' + p + url.search); return r; };
await installMocks(page, { state });
await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 120; i++) await page.clock.runFor(50);
await new Promise((r) => setTimeout(r, 1500));
for (let i = 0; i < 40; i++) await page.clock.runFor(50);
await page.screenshot({ path: `../shots/vsl-${name}.png`, scale: 'css' });
console.log([...new Set(calls)].join('\n'));
await browser.close();
