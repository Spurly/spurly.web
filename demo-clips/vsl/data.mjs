// Invented data for the VSL clips (signals, inbox, dashboard). Invented people and companies only.
import { SUMMARY, CAMPAIGNS, ok, analytics, ago } from '../fixtures.mjs';
export { ok, ago };

const P = (i, name, headline) => ({ i, name, headline });
export const VIEWERS = [
  P(1, 'Clara Weiss', 'Head of Marketing, Quillon'), P(2, 'Mateo Ruiz', 'Founder & CEO, Saltgrass'), P(3, 'Hannah Vogt', 'Operations Director | Cargoline Systems'),
  P(4, 'Ellis Okafor', 'Revenue lead, Pinewire Analytics'), P(5, 'Ida Nyström', 'Ops at Halden Cold Chain'), P(6, 'Ruben Claes', 'Sales Director · Mosscroft Energy'),
  P(7, 'Ana Kowalska', 'COO at Tidewater Parcel'), P(8, 'Lukas Brandt', 'Supply chain @ Fernhill Logistics'), P(9, 'Sofia Marchetti', 'Partnerships at Ardent Robotics'),
  P(10, 'Noah Becker', 'Head of Sales at Wendel Transport'),
].map((p, k) => ({
  providerId: 'v' + p.i, fullName: p.name, headline: p.headline, profileUrl: `https://www.linkedin.com/in/demo-v${p.i}`, photoUrl: '',
  lastViewedAt: ago(60 * (2 + k * 5)), lastViewedPrecision: 'hour', degree: k % 3 === 0 ? 1 : 2, connectionDegree: k % 3 === 0 ? 1 : 2, distance: k % 3 === 0 ? 'FIRST_DEGREE' : 'SECOND_DEGREE',
}));

export const POSTS = [
  ['Daniel Kaya', 'Head of Sales · Lindenhof Fulfilment', 'We tried three outbound playbooks this quarter. The one that worked was the simplest: short notes, real follow-ups, no pitch in the first message.', 214, 38],
  ['Leah Fischer', 'Founder at Mintory', 'Hot take: most founders quit outbound right before it starts working. Week 3 is where the replies show up.', 167, 52],
  ['Kwame Mensah', 'VP Growth — Northgate Credit', 'Our SDR team is hiring. If you have built outbound from zero at a seed-stage startup, I would love to talk.', 98, 21],
  ['Isla Morgan', 'Head of Growth, Fernpay', 'What is your follow-up cadence on LinkedIn? We are testing 2, 4 and 7 days and the difference is huge.', 143, 64],
  ['Tom Ashworth', 'CRO at Brickfield Bank', 'Outbound is not dead. Lazy outbound is dead.', 302, 47],
].map(([name, headline, text, reactions, comments], i) => ({
  socialId: 'p' + i, shareUrl: `https://www.linkedin.com/posts/demo-${i}`, text, reactions, comments, postedAgo: ['2h', '5h', '1d', '1d', '2d'][i], postedAt: ago(60 * [2, 5, 24, 26, 48][i]),
  author: { name, headline, providerId: 'a' + i, isCompany: false, profilePictureUrl: '' },
}));

const CO = { pinewire: ['Pinewire Analytics', 'Software Development'], saltgrass: ['Saltgrass', 'Food & Beverages'], kestrelfreight: ['Kestrel Freight', 'Transportation & Logistics'], lumorahealth: ['Lumora Health', 'Hospitals & Health Care'], quillon: ['Quillon', 'Financial Services'], ardentrobotics: ['Ardent Robotics', 'Automation Machinery'] };
const co = (k) => ({ companyId: 'co_' + k, name: CO[k][0], industry: CO[k][1], logoUrl: `https://img.logo.dev/${k}.demo?token=demo` });
export const JOBS = [
  ['Sales Development Representative', 'pinewire', 'Dublin, Ireland', 1], ['Senior SDR', 'pinewire', 'Dublin, Ireland', 2], ['Head of Outbound', 'saltgrass', 'Lyon, France', 2],
  ['SDR (DACH)', 'kestrelfreight', 'Munich, Germany', 3], ['Account Executive', 'kestrelfreight', 'Munich, Germany', 4], ['Business Development Rep', 'lumorahealth', 'Amsterdam, Netherlands', 5],
  ['Founding Account Executive', 'quillon', 'Frankfurt, Germany', 6], ['Outbound SDR', 'ardentrobotics', 'Milan, Italy', 7],
].map(([title, k, location, d], i) => ({ jobId: 'j' + i, title, company: co(k), location, url: `https://www.linkedin.com/jobs/view/demo-${i}`, postedAt: ago(60 * 24 * d), easyApply: i % 2 === 0, promoted: false }));

const CH = [
  ['Harriet Cole', 'Growth Lead, Quayside Capital', 'Sure, Thursday works. Send a link?', 12, 2, 1],
  ['Priya Raman', 'Head of Growth · Lumora Health', 'Thanks for connecting! Yes, happy to chat next week.', 48, 1, 1],
  ['Jonas Albrecht', 'VP Sales at Kestrel Freight', 'Interesting timing, we are rebuilding outbound right now.', 95, 1, 1],
  ['Sophie Turner', 'VP Growth at Coinwell', 'Can you share a bit more about how it works?', 180, 0, 2],
  ['Mateo Ruiz', 'Founder & CEO, Saltgrass', 'Appreciate the note. Let us talk after the 15th.', 300, 0, 1],
  ['Clara Weiss', 'Head of Marketing, Quillon', 'Ha, I did look at your profile. Good eye.', 420, 0, 2],
  ['Ellis Okafor', 'Revenue lead, Pinewire Analytics', 'Not right now, but keep me posted.', 900, 0, 1],
];
export const CHATS = CH.map(([name, headline, last, min, unread, degree], i) => ({
  _id: 'ch' + i, display: { name, headline, pictureUrl: '', profileUrl: `https://www.linkedin.com/in/demo-c${i}` }, lastMessageText: last, lastMessageIsSender: false,
  lastMessageAt: ago(min), unreadCount: unread, connectionDegree: degree, backfilledAt: ago(60 * 24),
}));
export const THREAD = [
  { s: true, text: 'Hi Harriet, saw Quayside just opened the London growth team. Congrats! Would love to swap notes on what is working for you.', min: 60 * 26 },
  { s: false, text: 'Thanks! It has been a busy quarter. What are you working on?', min: 60 * 25 },
  { s: true, text: 'We help growth teams run LinkedIn outreach on autopilot, in their own voice. Worth a 15-minute chat this week?', min: 60 * 3 },
  { s: false, text: 'Sure, Thursday works. Send a link?', min: 12 },
].map((m, i) => ({ _id: 'm' + i, unipileMessageId: 'um' + i, text: m.text, isSender: m.s, senderName: m.s ? 'Maya Lindqvist' : 'Harriet Cole', timestamp: ago(m.min), attachments: [], reactions: [], seenAt: m.s ? ago(m.min - 5) : null }));

export function extra(m, p, url, json) {
  if (p === '/hub/summary') return ok(SUMMARY);
  if (p.startsWith('/hub/summary/analytics')) return { success: true, data: analytics(Number(url.searchParams.get('days') || 30)) };
  if (p === '/hub/campaigns' && m === 'GET') return ok({ campaigns: CAMPAIGNS });
  if (p === '/hub/profile-viewers') return ok({ viewers: VIEWERS, total: 64, page: 1, limit: 25, summary: { identifiedTotal: 64, last7d: 23, last30d: 64, partialCount: 0, lockedCount: 0 }, partial: [], state: { lastSyncAt: ago(30), lastAttemptAt: ago(30), lastError: '', lastErrorCode: '', limited: false }, account: { connected: true, premium: true } });
  if (p === '/hub/discover/usage') return ok({ used: 4, cap: 100, resetsAt: null });
  if (p === '/hub/discover/posts') return ok({ posts: POSTS, rowCount: POSTS.length, cursor: 'c2', total: 1240, usage: { used: 5, cap: 100 } });
  if (p === '/hub/discover/jobs') return ok({ jobs: JOBS, rowCount: JOBS.length, cursor: 'c2', total: 380, usage: { used: 6, cap: 100 } });
  if (p === '/hub/discover/posts/import-authors') return ok({ search: { _id: 's_auth', name: 'People posting about outbound' }, imported: 5 });
  if (p === '/hub/inbox') return ok({ connected: true, sync: { status: 'done', finishedAt: ago(1) }, unread: 3, total: 46 });
  if (p === '/hub/inbox/chats') return ok({ chats: CHATS, pagination: { page: 1, limit: 30, total: CHATS.length }, total: CHATS.length });
  if (p.startsWith('/hub/inbox/chats/') && m === 'GET') return ok({ chat: CHATS[0], messages: THREAD, pagination: { page: 1, limit: 50, total: THREAD.length } });
  if (p.endsWith('/read')) return ok({ ok: true });
  return undefined;
}
