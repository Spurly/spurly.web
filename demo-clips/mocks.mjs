// Fake backend for the demo clips. Every /api call the real app makes is
// answered here. Invented people and companies only.

export const USER = {
  _id: 'u_demo', name: 'Maya Lindqvist', email: 'maya@northwind-demo.test',
  onboardingComplete: true, onboardingStage: 'done', tier: 'pro', creditBalance: 1240,
  linkedinPlan: 'premium', tablePreferences: {}, createdAt: '2026-06-01T09:00:00Z',
};

const now = Date.now();
const ago = (min) => new Date(now - min * 60000).toISOString();

export function lead(i, p) {
  return {
    _id: `l_${i}`, profileUrl: `https://www.linkedin.com/in/demo-${i}`,
    enrichmentStatus: 'none', connectionDegree: 2, createdAt: ago(60 * 24 * 3 + i * 7),
    ...p,
  };
}

// Leads already in the account before the clip starts.
export const EXISTING = [
  lead(1, { name: 'Jonas Albrecht', headline: 'VP Sales at Kestrel Freight', currentTitle: 'VP Sales', companyName: 'Kestrel Freight', location: 'Munich, Bavaria, Germany', connectionDegree: 1, enrichmentStatus: 'enriched', lastMessageSentAt: ago(60 * 26) }),
  lead(2, { name: 'Priya Raman', headline: 'Head of Growth · Lumora Health', currentTitle: 'Head of Growth', companyName: 'Lumora Health', location: 'Amsterdam, North Holland, Netherlands', connectionDegree: 2, enrichmentStatus: 'enriched', pendingInvitationSentAt: ago(60 * 30) }),
  lead(3, { name: 'Tomás Ferreira', headline: 'Founder at Brightloom Studio', currentTitle: 'Founder', companyName: 'Brightloom Studio', location: 'Paris, Île-de-France, France', connectionDegree: 2, enrichmentStatus: 'enriched', pendingInvitationSentAt: ago(60 * 50) }),
  lead(4, { name: 'Hannah Vogt', headline: 'Operations Director | Cargoline Systems', currentTitle: 'Operations Director', companyName: 'Cargoline Systems', location: 'Vienna, Austria', connectionDegree: 3, enrichmentStatus: 'enriched' }),
  lead(5, { name: 'Ellis Okafor', headline: 'Revenue lead, Pinewire Analytics', currentTitle: 'Revenue Lead', companyName: 'Pinewire Analytics', location: 'Dublin, County Dublin, Ireland', connectionDegree: 2, enrichmentStatus: 'enriched' }),
  lead(6, { name: 'Sofia Marchetti', headline: 'Partnerships at Ardent Robotics', currentTitle: 'Partnerships Manager', companyName: 'Ardent Robotics', location: 'Milan, Lombardy, Italy', connectionDegree: 1, enrichmentStatus: 'enriched' }),
  lead(7, { name: 'Lukas Brandt', headline: 'Supply chain @ Fernhill Logistics', currentTitle: 'Supply Chain Lead', companyName: 'Fernhill Logistics', location: 'Hamburg, Germany', connectionDegree: 2, enrichmentStatus: 'enriched' }),
  lead(8, { name: 'Ana Kowalska', headline: 'COO at Tidewater Parcel', currentTitle: 'COO', companyName: 'Tidewater Parcel', location: 'Warsaw, Masovian, Poland', connectionDegree: 3, enrichmentStatus: 'enriched' }),
  lead(9, { name: 'Ruben Claes', headline: 'Sales Director · Mosscroft Energy', currentTitle: 'Sales Director', companyName: 'Mosscroft Energy', location: 'Antwerp, Flanders, Belgium', connectionDegree: 2, enrichmentStatus: 'enriched', pendingInvitationSentAt: ago(60 * 70) }),
  lead(10, { name: 'Clara Weiss', headline: 'Head of Marketing, Quillon', currentTitle: 'Head of Marketing', companyName: 'Quillon', location: 'Frankfurt, Hesse, Germany', connectionDegree: 2, enrichmentStatus: 'enriched' }),
  lead(11, { name: 'Mateo Ruiz', headline: 'Founder & CEO, Saltgrass', currentTitle: 'CEO', companyName: 'Saltgrass', location: 'Lyon, France', connectionDegree: 2, enrichmentStatus: 'enriched' }),
  lead(12, { name: 'Ida Nyström', headline: 'Ops at Halden Cold Chain', currentTitle: 'Operations Manager', companyName: 'Halden Cold Chain', location: 'Rotterdam, South Holland, Netherlands', connectionDegree: 3, enrichmentStatus: 'enriched' }),
];

// Who the Find clip "imports": Berlin, logistics, Head of Operations, 2nd degree.
// A search-only row has no title/company yet (those come with enrichment).
export const IMPORTED = [
  ['Felix Hartmann', 'Head of Operations at Ostbahn Cargo'],
  ['Mira Schuster', 'Head of Operations · Spreeline Logistics'],
  ['Daniel Kaya', 'Head of Operations | Lindenhof Fulfilment'],
  ['Lena Petersen', 'Head of Operations, Kranich Freight'],
  ['Noah Becker', 'Head of Operations at Wendel Transport'],
  ['Elif Demir', 'Head of Operations — Havel Parcel'],
  ['Jakob Richter', 'Head of Operations @ Birkenweg Logistik'],
  ['Sara Lindner', 'Head of Operations, Tegel Freightworks'],
  ['Paul Neumann', 'Head of Operations at Stralau Shipping'],
  ['Amira Haddad', 'Head of Operations · Pankow Last Mile'],
].map(([name, headline], i) =>
  lead(100 + i, { name, headline, location: 'Berlin, Germany', connectionDegree: 2, enrichmentStatus: 'none', createdAt: ago(0.2) }),
);

export const LOGO_KEYS = {
  'Kestrel Freight': 'kestrelfreight', 'Lumora Health': 'lumorahealth', 'Brightloom Studio': 'brightloom', 'Cargoline Systems': 'cargoline',
  'Pinewire Analytics': 'pinewire', 'Ardent Robotics': 'ardentrobotics', 'Fernhill Logistics': 'fernhill', 'Tidewater Parcel': 'tidewater',
  'Mosscroft Energy': 'mosscroft', 'Quillon': 'quillon', 'Saltgrass': 'saltgrass', 'Halden Cold Chain': 'halden',
};

export const PARAMS = {
  LOCATION: [
    { id: '103035651', title: 'Berlin, Germany' },
    { id: '106967730', title: 'Berlin Metropolitan Area' },
    { id: '90009712', title: 'Berlingen, Thurgau, Switzerland' },
  ],
  INDUSTRY: [
    { id: '116', title: 'Transportation, Logistics, Supply Chain and Storage' },
    { id: '92', title: 'Truck Transportation' },
    { id: '93', title: 'Warehousing and Storage' },
  ],
  COMPANY: [], SCHOOL: [],
};

export function createState() {
  return { leads: [...EXISTING], searches: [], params: PARAMS };
}

function ok(data) { return { success: true, data }; }

export async function installMocks(page, { state = createState(), log = () => {}, delays = {} } = {}) {
  await page.addInitScript((user) => {
    localStorage.setItem('authToken', 'demo.jwt.token');
    localStorage.setItem('user', JSON.stringify(user));
    // Stand-in for the installed, signed-in extension's content-script bridge.
    const mark = () => document.documentElement && document.documentElement.setAttribute('data-spurly-ext', '1');
    mark(); document.addEventListener('readystatechange', mark); new MutationObserver(mark).observe(document, { childList: true });
    window.addEventListener('message', (ev) => {
      const d = ev.data;
      if (ev.source !== window || !d || d.__spurly !== 'request') return;
      window.postMessage({ __spurly: 'response', id: d.id, ok: true, data: { installed: true, loggedIn: true, version: '3.2.0', synced: true } }, window.location.origin);
    });
  }, USER);
  await page.route(/cdn\.pulse\.is|googletagmanager|google-analytics/, (r) => r.abort());

  // Third-party images the sandbox can't reach.
  await page.route(/flagcdn\.com\/.*/, async (route) => {
    const m = route.request().url().match(/\/(?:w|h)?\d+x?\d*\/([a-z]{2})\.png/) || route.request().url().match(/\/([a-z]{2})\.(?:png|svg)/);
    const code = m ? m[1] : 'xx';
    const fs = await import('node:fs');
    const f = new URL(`./flags/${code}.png`, import.meta.url);
    if (fs.existsSync(f)) return route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(f) });
    return route.fulfill({ status: 404, body: '' });
  });
  // Invented logo marks for the invented companies (served where logo.dev would be).
  await page.route(/img\.logo\.dev\//, async (route) => {
    const fs = await import('node:fs');
    const key = decodeURIComponent(new URL(route.request().url()).pathname.slice(1)).split('.')[0];
    const f = new URL(`./logos/${key}.png`, import.meta.url);
    if (fs.existsSync(f)) return route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(f) });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.route(/logo\.clearbit|googleusercontent|licdn\.com|fonts\.gstatic|google-analytics|googletagmanager|clarity\.ms/, (r) => r.fulfill({ status: 404, body: '' }));

  await page.route(/localhost:5000\/api\//, async (route) => {
    { const u = new URL(route.request().url()); if (state.hold && state.hold(route.request().method(), u.pathname.replace(/^\/api/, ''), route)) return; }
    state.inflight = (state.inflight || 0) + 1;
    try { await handle(route); } finally { state.inflight--; }
  });
  async function handle(route) {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname.replace(/^\/api/, '');
    const m = req.method();
    log(m, p + (url.search || ''));
    let body;
    const json = () => { try { return JSON.parse(req.postData() || '{}'); } catch { return {}; } };

    if (state.extra) body = state.extra(m, p, url, json);
    if (body) { /* scene-specific */ }
    else if (p === '/auth/me') body = ok(USER);
    else if (p === '/subscriptions/me') body = ok({ status: 'active', exempt: true, features: { hub: true } });
    else if (p === '/hub/leads' && m === 'GET') {
      let rows = state.leads;
      const es = url.searchParams.get('enrichmentStatus');
      if (es) rows = rows.filter((l) => es.split(',').includes(l.enrichmentStatus));
      body = ok({ leads: rows.slice(0, 50), pagination: { page: 1, limit: 50, total: rows.length } });
    } else if (p === '/hub/searches' && m === 'GET') body = ok({ searches: state.searches });
    else if (p === '/hub/searches' && m === 'POST') {
      const b = json();
      const s = { _id: 's_new', name: b.name || 'Berlin ops leads', status: 'queued', mode: 'structured', filters: b.filters, fetchTarget: b.count, fetchNew: 0, importedCount: 0, createdAt: new Date().toISOString() };
      state.searches = [s, ...state.searches];
      state.onCreate?.(s);
      body = ok({ search: s, appended: false });
    } else if (p === '/hub/audience/params') {
      const type = url.searchParams.get('type');
      const kw = (url.searchParams.get('keywords') || '').toLowerCase();
      body = ok({ params: (state.params[type] || []).filter((x) => x.title.toLowerCase().includes(kw.slice(0, 3))) });
      if (delays.params) await new Promise((r) => setTimeout(r, delays.params));
    } else if (p === '/hub/sourcing/usage') body = ok({ usage: { limits: { perFetch: 100, perDay: 1000, perMonth: 10000 }, remainingToday: 940, remainingThisMonth: 8620 } });
    else if (p === '/hub/account/health') body = ok({ health: { status: 'ok', capabilities: { companyPages: [] } } });
    else if (p === '/companies/logos') {
      const names = json().names || [];
      body = ok({ logos: Object.fromEntries(names.filter((n) => LOGO_KEYS[n]).map((n) => [n, `${LOGO_KEYS[n]}.demo`])) });
    } else if (p.startsWith('/hub/sequences')) body = ok({ sequences: [] });
    else body = ok({});

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  }
  return state;
}
