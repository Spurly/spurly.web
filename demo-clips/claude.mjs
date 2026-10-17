// Claude clip — Dashboard "Run Spurly from Claude" → Connect consent (Read + Draft, Act unticked)
// → Settings › AI assistants: Claude connected, actions OFF, its calls in Recent activity
// → Campaigns: the campaign Claude drafted sits in Draft. Nothing is sent.
import { installMocks, createState } from './mocks.mjs';
import { openStudio, Recorder } from './studio.mjs';
import { SUMMARY, CAMPAIGNS, CLAUDE_DRAFT, ago, ok, analytics, DASH_SUMMARY } from './fixtures.mjs';

const PROBE = process.argv.includes('--probe');
const { browser, ctx, page } = await openStudio();
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:3000' });
await page.addInitScript(() => { window.open = () => null; });

const state = createState();
let refreshed = false;
let drafted = false;
const CALLS = [
  { id: 'a4', tool: 'create_campaign', scope: 'draft', ok: true, clientName: 'Claude', at: ago(0.4) },
  { id: 'a3', tool: 'run_people_search', scope: 'read', ok: true, clientName: 'Claude', at: ago(0.9) },
  { id: 'a2', tool: 'list_inbox_chats', scope: 'read', ok: true, clientName: 'Claude', at: ago(1.6) },
  { id: 'a1', tool: 'get_dashboard', scope: 'read', ok: true, clientName: 'Claude', at: ago(2.1) },
];
state.hold = (m, p) => m === 'POST' && p === '/oauth/consent';
state.extra = (m, p, url) => {
  if (p === '/hub/summary') return ok(SUMMARY);
  if (p === '/hub/summary/dashboard') return ok(DASH_SUMMARY);
  if (p === '/hub/summary/analytics') return ok(analytics(Number(url.searchParams.get('days')) || 30));
  if (p === '/hub/campaigns' && m === 'GET') return ok({ campaigns: drafted ? [CLAUDE_DRAFT, ...CAMPAIGNS] : CAMPAIGNS });
  if (p === '/oauth/consent-info') return ok({ client: { id: 'https://claude.ai/oauth/mcp-client', name: 'Claude' }, scopes: ['read', 'draft', 'act'] });
  if (p === '/oauth/connections') return ok({ connections: [{ id: 'k1', name: 'Claude', scopes: ['read', 'draft'], connectedAt: ago(3), lastUsedAt: ago(0.4) }] });
  if (p === '/api-tokens/settings') return ok({ mcpActionsEnabled: false });
  if (p === '/api-tokens') return ok({ tokens: [] });
  if (p === '/mcp/activity') return ok({ calls: refreshed ? CALLS : [] });
  return undefined;
};
await installMocks(page, { state });

const rec = new Recorder(page, PROBE ? 'frames/probe' : 'frames/claude', { inflight: () => state.inflight || 0 });
rec.dry = PROBE;
const CONSENT = '/oauth/consent?response_type=code&client_id=https%3A%2F%2Fclaude.ai%2Foauth%2Fmcp-client&redirect_uri=https%3A%2F%2Fclaude.ai%2Fapi%2Fmcp%2Fauth_callback&scope=read%20draft%20act&state=demo&code_challenge=x&code_challenge_method=S256';

async function scene(path, ready, setup) {
  const wasCapturing = rec.capturing;
  rec.capturing = false;
  await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 300; i++) { await rec.frame(); if (i > 20 && (await ready())) break; }
  if (setup) await setup();
  await rec.wait(300);
  rec.capturing = wasCapturing;
}

// ── Scene 1: Dashboard card
rec.mouse = { x: 1180, y: 720 };
await scene('/hub/dashboard', async () => (await page.getByTestId('claude-connect').isVisible()) && (await page.locator('.recharts-surface, svg path').count()) > 10);
const cardTop = await page.evaluate(() => { const s = document.querySelector('.ui-sheet'); const card = document.querySelector('section[aria-label="Run Spurly from Claude"]'); return card.getBoundingClientRect().top + s.scrollTop - 150; });
if (PROBE) await page.screenshot({ path: 'shots/claude-1.png', scale: 'css' });
await rec.rect('card', page.locator('section[aria-label="Run Spurly from Claude"]'));
rec.capturing = true;
rec.mark('start');
await rec.wait(700);
await rec.scrollTo('.ui-sheet', cardTop, 1000);
rec.mark('card');
await rec.rect('card', page.locator('section[aria-label="Run Spurly from Claude"]'));
await rec.wait(200);
await rec.clickOn(page.getByTestId('claude-connect'), { ms: 750, pause: 450 });
await rec.wait(650);

// ── Scene 2: the connect screen Claude sends you to
await scene(CONSENT, () => page.getByRole('button', { name: 'Approve' }).isVisible());
rec.cut('consent');
if (PROBE) await page.screenshot({ path: 'shots/claude-2.png', scale: 'css' });
await rec.rect('consentCard', page.locator('h1').locator('xpath=..'));
await rec.wait(900);
await rec.clickOn(page.getByRole('button', { name: 'Approve' }), { ms: 650, pause: 120 });
await rec.wait(600);

// ── Scene 3: Settings › AI assistants
await scene('/dashboard/settings/ai-assistants', () => page.getByText('Allow AI assistants to take actions').isVisible());
rec.cut('settings');
if (PROBE) await page.screenshot({ path: 'shots/claude-3.png', scale: 'css' });
await rec.rect('apps', page.getByText('Connected apps').first());
await rec.wait(1100);
const refresh = page.getByRole('button', { name: 'Refresh' });
const sheetTop = await page.evaluate(() => { const s = document.querySelector('.ui-sheet'); const h = [...document.querySelectorAll('h2,h3,p,span')].find((e) => e.textContent.trim() === 'Recent activity'); return h ? h.getBoundingClientRect().top + s.scrollTop - 150 : 600; });
await rec.scrollTo('.ui-sheet', sheetTop, 800);
rec.mark('activity');
await rec.wait(200);
refreshed = true;
drafted = true;
await rec.clickOn(refresh, { ms: 600, pause: 100 });
await rec.wait(1300);
if (PROBE) await page.screenshot({ path: 'shots/claude-3b.png', scale: 'css' });

// ── Scene 4: Campaigns — Claude's campaign waits as a Draft
await scene('/hub/campaigns', () => page.getByText(CLAUDE_DRAFT.name).isVisible());
rec.cut('campaigns');
if (PROBE) await page.screenshot({ path: 'shots/claude-4.png', scale: 'css' });
await rec.rect('draft', page.getByText(CLAUDE_DRAFT.name).first());
await rec.wait(500);
const d = rec.rects.draft;
await rec.move(d.x + d.width / 2 + 40, d.y + 60, 800);
await rec.wait(1600);
rec.mark('end');

rec.save();
console.log('frames', rec.n, 'seconds', (rec.n / 60).toFixed(2), JSON.stringify(rec.marks), JSON.stringify(rec.rects));
await browser.close();
