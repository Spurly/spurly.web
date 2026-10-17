// Shared fake data for the Claude / Follow up / Invitations clips. Invented only.
const now = Date.now();
export const ago = (min) => new Date(now - min * 60000).toISOString();

export const SUMMARY = {
  leadsTotal: 2140, leadsNeedingEnrichment: 38, campaignsRunning: 2, inboxUnread: 3,
  pacing: { dayUsed: 11, dailyCap: 25 },
};

export const CAMPAIGNS = [
  { _id: 'c1', name: 'Berlin ops leads — intro', type: 'invite', status: 'running', createdAt: ago(60 * 24 * 4), lastRunAt: ago(14),
    counts: { total: 30, pending: 14, invited: 9, connected: 7, messaged: 0, failed: 0 } },
  { _id: 'c2', name: 'Amsterdam growth leads', type: 'invite', status: 'running', createdAt: ago(60 * 24 * 9), lastRunAt: ago(32),
    counts: { total: 60, pending: 21, invited: 18, connected: 19, messaged: 2, failed: 0 } },
  { _id: 'c3', name: 'Founders met at SaaStock', type: 'message', status: 'done', createdAt: ago(60 * 24 * 20), completedAt: ago(60 * 24 * 6), lastRunAt: ago(60 * 24 * 6),
    counts: { total: 24, pending: 0, invited: 0, connected: 0, messaged: 24, failed: 0 } },
];

export const CLAUDE_DRAFT = {
  _id: 'c9', name: 'Heads of growth · London fintech', type: 'invite', status: 'draft', createdAt: ago(0.3),
  note: 'Hi {{firstName}}, I work with growth teams at fintechs in London and would like to connect.',
  counts: { total: 40, pending: 40, invited: 0, connected: 0, messaged: 0, failed: 0 },
};

export function ok(data) { return { success: true, data }; }

/** A believable 30-day /hub/summary/analytics payload (shape from tests/dashboard.analytics.test.jsx). */
export function analytics(days = 30) {
  const d0 = new Date(); d0.setUTCHours(0, 0, 0, 0);
  const dayList = Array.from({ length: days }, (_, i) => new Date(d0.getTime() - (days - 1 - i) * 864e5).toISOString().slice(0, 10));
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const wave = (base, amp) => dayList.map((_, i) => Math.max(0, Math.round(base + amp * Math.sin(i / 3.1) + (r() - 0.4) * amp + i * base / 60)));
  const invites = wave(14, 6), messages = wave(5, 3), newConnections = wave(5, 3), replies = wave(2, 2), newViewers = wave(3, 2);
  let n = 846; const network = newConnections.map((v) => (n += v));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const grid = Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => (d < 5 && h >= 8 && h <= 18 ? Math.round(3 + 4 * Math.sin((h - 8) / 3) + r() * 3) : 0)));
  const rgrid = grid.map((row) => row.map((v) => Math.round(v * 0.25 * r())));
  const half = (a) => Math.round(sum(a) * 0.82);
  const p = (a) => ({ value: sum(a), prev: half(a), delta: Math.round(((sum(a) - half(a)) / half(a)) * 100) });
  return {
    range: { days, timezone: 'Europe/Berlin' }, startedAt: dayList[0], daysWithSpurly: 64,
    totals: { invites: 1240, messages: 386, connections: network.at(-1), connectionsSinceStart: network.at(-1) - 846 + 120, repliesConversations: 74 },
    period: { invites: p(invites), messages: p(messages), newConnections: p(newConnections), replies: p(replies), newViewers: p(newViewers) },
    series: { days: dayList, invites, messages, newConnections, replies, newViewers, network },
    acceptance: { rate: 38.4, matured: 312, accepted: 120, windowDays: 14 },
    reply: { rate: 21.6, conversations: 342, replied: 74, medianHoursToReply: 6 },
    funnel: [
      { key: 'leads', label: 'Leads', value: 2140 }, { key: 'invited', label: 'Invited', value: 1240 },
      { key: 'connected', label: 'Connected', value: 476 }, { key: 'conversations', label: 'Conversations', value: 74 },
    ],
    heat: { sends: grid, replies: rgrid },
    campaigns: [
      { id: 'c2', name: 'Amsterdam growth leads', type: 'connect', status: 'running', sent: 39, accepted: 19, messaged: 2, rate: 48.7 },
      { id: 'c1', name: 'Berlin ops leads — intro', type: 'connect', status: 'running', sent: 16, accepted: 7, messaged: 0, rate: 43.8 },
      { id: 'c3', name: 'Founders met at SaaStock', type: 'message', status: 'done', sent: 24, accepted: 0, messaged: 24, rate: 0 },
    ],
    audience: {
      locations: [{ label: 'Germany', value: 612 }, { label: 'Netherlands', value: 341 }, { label: 'United Kingdom', value: 298 }, { label: 'France', value: 187 }],
      companies: [{ label: 'Kestrel Freight', value: 14 }, { label: 'Lumora Health', value: 11 }, { label: 'Cargoline Systems', value: 9 }, { label: 'Pinewire Analytics', value: 7 }],
    },
  };
}

export const DASH_SUMMARY = { leadsTotal: 2140, leadsNeedingEnrichment: 38, connectRate: 38, inboxUnread: 3, pacing: { dayUsed: 11, dailyCap: 25 } };
