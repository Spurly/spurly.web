// Follow up clip — Campaign (draft) → Edit note → Write with AI → Save → Start sending → Review → paced sending
// → Sequence: Flow (Visit → Connect → Wait until accepted → Message → Wait → Message) → Enrolled: replied leads stopped.
import { installMocks, createState } from './mocks.mjs';
import { openStudio, Recorder } from './studio.mjs';
import { SUMMARY, CAMPAIGNS, CLAUDE_DRAFT, ago, ok } from './fixtures.mjs';

const PROBE = process.argv.includes('--probe');
const { browser, page } = await openStudio();
const state = createState();

const AI_NOTE = 'Hi {{firstName}}, I work with growth leaders at London fintechs and would be glad to swap notes on what is working for your team. Happy to connect.';
let campaign = { ...CLAUDE_DRAFT, note: '' };
const PEOPLE = [
  ['Oliver Grant', 'Head of Growth at Ledgerline'], ['Amara Okoye', 'Head of Growth · Penny Lane Pay'], ['Harriet Cole', 'Growth Lead, Quayside Capital'],
  ['Rohan Mehta', 'Head of Growth @ Thamesbridge Money'], ['Sophie Turner', 'VP Growth at Coinwell'], ['Kwame Mensah', 'Head of Growth — Northgate Credit'],
  ['Isla Morgan', 'Head of Growth, Fernpay'], ['Daniel Novak', 'Growth Director at Blackfriars FX'], ['Leah Fischer', 'Head of Growth · Mintory'],
  ['Tom Ashworth', 'Head of Growth at Brickfield Bank'], ['Nadia Rahman', 'Head of Lifecycle Growth, Orbitpay'], ['Ethan Clarke', 'Head of Growth @ Sterling Loop'],
];
const members = PEOPLE.map(([name, headline], i) => ({ _id: `m${i}`, name, headline, companyName: headline.split(/ at | · | @ | — |, /).pop(), status: 'pending', profileUrl: `https://www.linkedin.com/in/demo-m${i}` }));
let composeRoute = null;
let started = false;

const STEPS = [
  { type: 'profile_visit', config: { notify: true }, delayDays: 0 },
  { type: 'connect', config: { note: 'Hi {{firstName}}, saw your work at {{company}}. Would be glad to connect.' }, delayDays: 0 },
  { type: 'wait', config: { mode: 'until-accepted', days: 2, maxDays: 7 }, delayDays: 0 },
  { type: 'message', config: { text: 'Thanks for connecting, {{firstName}}. Quick question about how {{company}} runs outbound…' }, delayDays: 0 },
  { type: 'wait', config: { mode: 'fixed', days: 4, maxDays: 7 }, delayDays: 0 },
  { type: 'message', config: { text: 'Following up on my note, {{firstName}}. Worth a 15-minute chat?' }, delayDays: 0 },
];
const SEQUENCE = { _id: 's1', name: 'London fintech — follow-ups', status: 'running', steps: STEPS, createdAt: ago(60 * 24 * 12), startedAt: ago(60 * 24 * 11) };
const H = (type, outcome, min) => ({ stepIndex: 0, type, outcome, at: ago(min) });
const ENROLL = [
  { name: 'Harriet Cole', headline: 'Growth Lead, Quayside Capital', status: 'stopped', currentStepIndex: 3, stopReason: 'lead-replied', history: [H('message', 'stopped', 50)] },
  { name: 'Kwame Mensah', headline: 'Head of Growth — Northgate Credit', status: 'waiting', currentStepIndex: 4, history: [H('message', 'sent', 60 * 20)] },
  { name: 'Oliver Grant', headline: 'Head of Growth at Ledgerline', status: 'active', currentStepIndex: 3, history: [H('wait', 'done', 90)] },
  { name: 'Sophie Turner', headline: 'VP Growth at Coinwell', status: 'stopped', currentStepIndex: 5, stopReason: 'lead-replied', history: [H('message', 'stopped', 60 * 5)] },
  { name: 'Amara Okoye', headline: 'Head of Growth · Penny Lane Pay', status: 'waiting', currentStepIndex: 2, history: [H('connect', 'sent', 60 * 30)] },
  { name: 'Rohan Mehta', headline: 'Head of Growth @ Thamesbridge Money', status: 'completed', currentStepIndex: 6, history: [H('message', 'sent', 60 * 26)] },
  { name: 'Isla Morgan', headline: 'Head of Growth, Fernpay', status: 'waiting', currentStepIndex: 2, history: [H('connect', 'sent', 60 * 44)] },
  { name: 'Daniel Novak', headline: 'Growth Director at Blackfriars FX', status: 'active', currentStepIndex: 1, history: [H('profile_visit', 'done', 35)] },
  { name: 'Leah Fischer', headline: 'Head of Growth · Mintory', status: 'waiting', currentStepIndex: 4, history: [H('message', 'sent', 60 * 50)] },
  { name: 'Tom Ashworth', headline: 'Head of Growth at Brickfield Bank', status: 'completed', currentStepIndex: 6, history: [H('message', 'sent', 60 * 70)] },
  { name: 'Nadia Rahman', headline: 'Head of Lifecycle Growth, Orbitpay', status: 'waiting', currentStepIndex: 2, history: [H('connect', 'sent', 60 * 8)] },
  { name: 'Ethan Clarke', headline: 'Head of Growth @ Sterling Loop', status: 'active', currentStepIndex: 0, history: [] },
].map((e, i) => ({ _id: `e${i}`, profileUrl: `https://www.linkedin.com/in/demo-e${i}`, startedAt: ago(60 * 24 * (11 - (i % 5))), ...e }));

const pacing = { ok: true, quiet: { enabled: true, startHour: 22, endHour: 7 }, timezone: 'Europe/London', dailyCap: 25, dayUsed: 11, weekUsed: 64, weeklyLimit: 150, action: 'invite' };
const detail = () => ({
  campaign, counts: campaign.counts,
  account: { notesAllowed: true, noteCap: 200 }, pacing,
  sender: { expected: true, stale: false, lastRunAt: ago(1) },
});

state.hold = (m, p, route) => { if (p === '/personalization/compose') { composeRoute = route; return true; } return false; };
state.extra = (m, p, url, json) => {
  if (p === '/hub/summary') return ok(SUMMARY);
  if (p === '/hub/campaigns' && m === 'GET') return ok({ campaigns: [campaign, ...CAMPAIGNS] });
  if (p === '/hub/campaigns/c9' && m === 'GET') return ok(detail());
  if (p === '/hub/campaigns/c9' && m === 'PATCH') { campaign = { ...campaign, ...json() }; return ok({ campaign }); }
  if (p === '/hub/campaigns/c9/start') { started = true; campaign = { ...campaign, status: 'running', lastRunAt: ago(0.1), counts: { ...campaign.counts, pending: 38, invited: 2 } }; return ok({ campaign }); }
  if (p === '/hub/campaigns/c9/members') return ok({ members: started ? members.map((x, i) => (i < 2 ? { ...x, status: 'invited', sentAt: ago(0.05) } : x)) : members, pagination: { page: 1, limit: 50, total: 40 } });
  if (p === '/personalization/status') return ok({ available: true, providers: ['demo'], quota: { remaining: 46, limit: 50 }, defaultTone: 'professional', contextConfigured: true });
  if (p === '/hub/sequences/s1' && m === 'GET') return ok({ sequence: SEQUENCE, enrollmentCounts: { active: 9, waiting: 22, completed: 4, stopped: 3, failed: 0 } });
  if (p === '/hub/sequences/s1/enrollments') return ok({ enrollments: ENROLL, total: 38, page: 1, limit: 50 });
  if (p === '/hub/sequences') return ok({ sequences: [SEQUENCE] });
  return undefined;
};
await installMocks(page, { state });

const rec = new Recorder(page, PROBE ? 'frames/probe' : 'frames/follow', { inflight: () => state.inflight || 0 });
rec.dry = PROBE;
const shot = (n) => PROBE && page.screenshot({ path: `shots/follow-${n}.png`, scale: 'css' });

async function scene(path, ready) {
  const was = rec.capturing;
  rec.capturing = false;
  await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 300; i++) { await rec.frame(); if (i > 20 && (await ready())) break; }
  await rec.wait(300);
  rec.capturing = was;
}

// ── Scene 1: the draft campaign
rec.mouse = { x: 900, y: 520 };
await scene('/hub/campaigns/c9', () => page.getByRole('button', { name: 'Edit note' }).isVisible());
await shot(1);
rec.capturing = true;
rec.mark('start');
await rec.wait(500);
await rec.clickOn(page.getByRole('button', { name: 'Edit note' }), { ms: 650 });
rec.mark('edit');
await rec.wait(350);
await rec.rect('rail', page.getByLabel('Connection note'));
await rec.clickOn(page.getByRole('button', { name: 'Write', exact: true }).first(), { ms: 520 });
await rec.wait(450);
await shot(2);
// the panel's own Write button (the last "Write" on the page)
await rec.clickOn(page.getByRole('button', { name: 'Write', exact: true }).last(), { ms: 480 });
rec.mark('writing');
await rec.wait(900);
await composeRoute.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok({ text: AI_NOTE })) });
composeRoute = null;
await rec.wait(900);
rec.mark('written');
await shot(3);
await rec.clickOn(page.getByRole('button', { name: 'Save note' }), { ms: 520 });
await rec.wait(500);
await rec.clickOn(page.getByRole('button', { name: 'Start sending' }), { ms: 700 });
rec.mark('review');
await rec.wait(900);
await shot(4);
await rec.clickOn(page.getByRole('button', { name: 'Send connection requests' }), { ms: 600 });
rec.mark('sending');
await rec.wait(1000);
await shot(5);

// ── Scene 2: the sequence that follows up, and stops when they reply
await scene('/hub/sequences/s1', () => page.getByRole('tab', { name: /Enrolled/ }).isVisible().catch(() => false).then(async (v) => v || page.getByText('Enrolled').first().isVisible()));
rec.cut('sequence');
await shot(6);
await rec.wait(800);
const enrolledTab = page.getByRole('tab', { name: /Enrolled/ }).first();
const tabTarget = (await enrolledTab.count()) ? enrolledTab : page.getByText('Enrolled', { exact: true }).first();
await rec.clickOn(tabTarget, { ms: 600 });
rec.mark('enrolled');
await rec.wait(300);
// slide the table so the Last event column is fully in view (the real table scrolls sideways)
const sc = await page.evaluate(() => {
  const cell = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Replied — handed to you');
  let el = cell; while (el && !(el.scrollWidth > el.clientWidth + 4 && getComputedStyle(el).overflowX !== 'visible')) el = el.parentElement;
  if (!el) return null; el.setAttribute('data-demo-scroll', '1');
  const over = cell.getBoundingClientRect().right - el.getBoundingClientRect().right + 40;
  return Math.max(0, Math.min(el.scrollWidth - el.clientWidth, over));
});
if (sc) {
  const n = 40;
  for (let i = 1; i <= n; i++) {
    const t = i / n, k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    await page.evaluate((x) => { document.querySelector('[data-demo-scroll]').scrollLeft = x; }, sc * k);
    await rec.frame();
  }
}
await rec.wait(150);
await rec.rect('replied', page.getByText('Replied — handed to you').first());
const r = rec.rects.replied;
await rec.move(r.x + r.width / 2, r.y + r.height / 2 + 4, 700);
await rec.wait(1300);
await shot(7);
rec.mark('end');

rec.save();
console.log('frames', rec.n, 'seconds', (rec.n / 60).toFixed(2), JSON.stringify(rec.marks), JSON.stringify(rec.rects));
await browser.close();
