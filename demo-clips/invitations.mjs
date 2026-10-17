// Invitations clip — Sent: withdraw a stale one → Received: accept a match → Rules: switch on
// auto-withdraw + auto-accept by headline keywords → Save. Everything on the real /hub/invitations page.
import { installMocks, createState } from './mocks.mjs';
import { openStudio, Recorder } from './studio.mjs';
import { SUMMARY, ago, ok } from './fixtures.mjs';

const PROBE = process.argv.includes('--probe');
const { browser, page } = await openStudio();
const state = createState();

const SENT = [
  ['Marta Lindqvist', 'Head of Partnerships at Brightloom Studio', 34, 'Hi Marta, loved the Brightloom launch post. Would be glad to connect.'],
  ['Jonah Weiss', 'COO · Tidewater Parcel', 29, ''],
  ['Priyanka Das', 'Founder, Saltgrass', 23, 'Hi Priyanka, fellow founder here. Would be glad to connect.'],
  ['Felix Hartmann', 'Head of Operations at Ostbahn Cargo', 6, 'Hi Felix, I work with ops teams in Berlin. Would be glad to connect.'],
  ['Mira Schuster', 'Head of Operations · Spreeline Logistics', 4, ''],
  ['Daniel Kaya', 'Head of Operations | Lindenhof Fulfilment', 2, 'Hi Daniel, saw your post on cold-chain capacity. Happy to connect.'],
  ['Lena Petersen', 'Head of Operations, Kranich Freight', 1, ''],
].map(([n, h, d, note], i) => ({ unipileInvitationId: `s${i}`, invitedName: n, invitedHeadline: h, ageDays: d, stale: d >= 21, note, invitedPublicId: `demo-s${i}` }));
const RECEIVED = [
  ['Ava Brennan', 'Founder & CEO at Northwind Labs', 'Hi! Saw your post on outbound. Would love to connect.', 25],
  ['Sam Whitaker', 'Recruiter at Bluegate Talent', 'We have exciting roles for you!', 70],
  ['Chen Wei', 'Head of Growth · Ledgerline', '', 120],
  ['Grace Lyons', 'Student at Kingsbridge University', '', 200],
  ['Mateus Rocha', 'Co-founder, Pinewire Analytics', 'Fellow founder here, happy to swap notes.', 300],
].map(([n, h, msg, min], i) => ({ unipileInvitationId: `r${i}`, inviterName: n, inviterHeadline: h, message: msg, receivedAt: ago(min), actionable: true, inviterProfileUrl: `https://www.linkedin.com/in/demo-r${i}` }));
let rules = { autoWithdraw: { enabled: false, afterDays: 21 }, autoAccept: { enabled: false, acceptAll: false, headlineKeywords: [] }, lastRunAt: null, lastRun: null };
const usage = { withdraw_invite: { usedDay: 2, dailyCap: 20 }, respond_invite: { usedDay: 3, dailyCap: 30 } };

state.extra = (m, p, url, json) => {
  if (p === '/hub/summary') return ok(SUMMARY);
  if (p === '/hub/invitations/sent' && m === 'GET') return ok({ items: SENT, cursor: null, staleAfterDays: 21 });
  if (p.startsWith('/hub/invitations/sent/') && m === 'DELETE') { usage.withdraw_invite.usedDay += 1; return { success: true, message: 'Withdrawn', data: {} }; }
  if (p === '/hub/invitations/received') return ok({ items: RECEIVED, cursor: null });
  if (p.endsWith('/respond')) { usage.respond_invite.usedDay += 1; return { success: true, message: 'Accepted', data: {} }; }
  if (p === '/hub/invitations/rules' && m === 'GET') return ok(rules);
  if (p === '/hub/invitations/rules' && m === 'PUT') { rules = { ...rules, ...json() }; return ok(rules); }
  if (p === '/hub/invitations/usage') return ok({ connected: true, usage });
  return undefined;
};
await installMocks(page, { state });

const rec = new Recorder(page, PROBE ? 'frames/probe' : 'frames/invitations', { inflight: () => state.inflight || 0 });
rec.dry = PROBE;
const shot = (n) => PROBE && page.screenshot({ path: `shots/inv-${n}.png`, scale: 'css' });

rec.capturing = false;
rec.mouse = { x: 1150, y: 640 };
await page.goto('http://localhost:3000/hub/invitations', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 300; i++) { await rec.frame(); if (i > 20 && (await page.getByText('Marta Lindqvist').isVisible())) break; }
await rec.wait(300);
await shot(1);

rec.capturing = true;
rec.mark('start');
await rec.wait(450);
// 1. Sent: withdraw the oldest, stale request
const martaRow = page.getByRole('row').filter({ hasText: 'Marta Lindqvist' });
await rec.rect('sentTable', page.getByRole('table').first());
await rec.clickOn(martaRow.getByRole('button', { name: 'Withdraw' }), { ms: 750 });
rec.mark('confirm');
await rec.wait(550);
await rec.clickOn(page.getByRole('dialog').getByRole('button', { name: 'Withdraw' }), { ms: 520 });
rec.mark('withdrawn');
await rec.wait(650);
await shot(2);

// 2. Received: accept the founder
await rec.clickOn(page.getByRole('tab', { name: /Received/ }), { ms: 650 });
rec.mark('received');
await rec.waitFor(page.getByText('Ava Brennan'));
await rec.wait(350);
await shot(3);
const avaRow = page.getByRole('row').filter({ hasText: 'Ava Brennan' });
await rec.clickOn(avaRow.getByRole('button', { name: 'Accept' }), { ms: 700 });
await rec.wait(400);
if (await page.getByRole('dialog').isVisible().catch(() => false)) {
  await shot('3b');
  await rec.clickOn(page.getByRole('dialog').getByRole('button', { name: /Accept/ }).last(), { ms: 500 });
}
rec.mark('accepted');
await rec.wait(600);

// 3. Rules: let Spurly do both from now on
await rec.clickOn(page.getByRole('tab', { name: /Rules/ }), { ms: 650 });
rec.mark('rules');
await rec.waitFor(page.getByText('Withdraw stale invitations'));
await rec.wait(350);
await shot(4);
const switches = page.getByRole('switch');
await rec.clickOn(switches.nth(0), { ms: 600 });
await rec.wait(300);
await rec.clickOn(switches.nth(1), { ms: 600 });
await rec.wait(250);
await rec.clickOn(page.getByPlaceholder('founder, cto, head of growth'), { ms: 520, dx: -120 });
await rec.type('founder, head of growth', 45);
rec.mark('typed');
await rec.wait(350);
await rec.clickOn(page.getByRole('button', { name: 'Save rules' }), { ms: 600 });
rec.mark('saved');
await rec.wait(1200);
await shot(5);
rec.mark('end');

rec.save();
console.log('frames', rec.n, 'seconds', (rec.n / 60).toFixed(2), JSON.stringify(rec.marks), JSON.stringify(rec.rects));
await browser.close();
