import { W, H, clamp, lerp, ease, pr, el, css, at, find, cue, kinetic, fmtMoney, FX } from './lib.js';
import { part2 } from './scenes2.js';

// ── palettes over time (bg crossfades) ──
export const PALETTES = [];
export const MUSIC = [];
const pal = (t, p) => PALETTES.push({ t, ...p });
const mus = (t, mood, extra = {}) => MUSIC.push({ t: +t.toFixed(3), mood, ...extra });

export const P = {
  night: { base: '#05071a', b0: '#1d2a7a', b1: '#9a4a5a', b2: '#33288a', b3: '#0f3a6e', grid: 0.6, vig: 1 },
  dawn: { base: '#070a22', b0: '#2b46c8', b1: '#ff8a5b', b2: '#6a3fd0', b3: '#0f4f86', grid: 0.8, vig: 1 },
  brand: { base: '#060918', b0: '#2f4fd8', b1: '#7a5cff', b2: '#0e7490', b3: '#3b2a9a', grid: 1, vig: 1 },
  cold: { base: '#0a0c12', b0: '#262b38', b1: '#4a1f2b', b2: '#1c212d', b3: '#2a1a22', grid: 0.35, vig: 1.25 },
  light: { base: '#f2f4ff', b0: '#c3cdff', b1: '#e3d4ff', b2: '#b9e6ff', b3: '#ffe2c7', grid: 1, vig: 0, light: true },
  deep: { base: '#04050f', b0: '#1a1f5c', b1: '#3c1f7a', b2: '#0b2c4a', b3: '#1b1240', grid: 0.4, vig: 1.3 },
};

// ── icons ──
export const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/><path d="M19 15v6m0 0l-2.5-2.5M19 21l2.5-2.5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>',
  paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4.5h6v3H9z"/><path d="M9 12h6M9 16h4" stroke-linecap="round"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/></svg>',
  loop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 014-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 01-4 4H4"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg>',
  brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5h6v2"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4" stroke-linecap="round"/></svg>',
  hourglass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M17 6.5c-1-1.5-3-2-5-2-2.8 0-5 1.3-5 3.7 0 5.3 10 2.6 10 8 0 2.4-2.3 3.8-5 3.8-2.2 0-4.3-.7-5.3-2.3"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/></svg>',
  fork: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 3v7a2 2 0 002 2v9M11 3v7a2 2 0 01-2 2M17 3c-2 2-2 6 0 8v10"/></svg>',
};
export const icon = (name, size, color, parent, cls = '') => {
  const d = el('div', 'ico ' + cls, parent, ICON[name]);
  css(d, { width: size + 'px', height: size + 'px', color });
  d.firstChild.style.width = '100%'; d.firstChild.style.height = '100%';
  return d;
};

// text helper: positioned kinetic text. a = align 'left'|'center'
export function txt(parent, text, { x = W / 2, y = 540, a = 'center', ...o } = {}) {
  const k = kinetic(parent, text, { align: a, ...o });
  if (a === 'left') css(k.node, { left: x + 'px', top: y + 'px', transform: 'none' });
  else css(k.node, { left: x + 'px', top: y + 'px', transform: 'translateX(-50%)' });
  return k;
}

const AV = [['PR', '#f472b6', '#7c3aed'], ['JA', '#38bdf8', '#2563eb'], ['HC', '#fbbf24', '#f97316'], ['CW', '#34d399', '#059669'], ['TF', '#a78bfa', '#6d28d9'], ['SM', '#fb7185', '#e11d48'], ['EO', '#22d3ee', '#0e7490'], ['LB', '#fcd34d', '#d97706']];
export function avatar(parent, i, size) {
  const [ini, c1, c2] = AV[i % AV.length];
  const a = el('div', 'av', parent, ini);
  css(a, { width: size + 'px', height: size + 'px', fontSize: size * 0.38 + 'px', background: `linear-gradient(135deg,${c1},${c2})`, boxShadow: '0 6px 16px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.35)' });
  return a;
}

// camera shake helper for slams
export const shake = (t, t0, amp = 14, d = 0.35) => {
  const u = (t - t0) / d; if (u < 0 || u > 1) return [0, 0];
  const k = amp * (1 - u) * (1 - u);
  return [Math.sin((t - t0) * 97) * k, Math.cos((t - t0) * 73) * k];
};

// a scene record
export function S(root, t0, t1, opts, build) {
  const node = el('div', 'scene', root);
  const s = { t0, t1, node, enter: 'zoom', ...opts };
  s.update = build(node, s) || (() => {});
  return s;
}

export function buildScenes(root) {
  const out = [];
  const add = (s) => (out.push(s), s);

  // ───────────────────── 1. HOOK: the phone at 7 a.m. ─────────────────────
  const tA = 0, tWork = at('But it\'s been'), tNew = at('New connections'), tAcc = at('accepted while'), tRep = at('Replies waiting'),
    tView = at('Everyone who viewed'), tVoice = at('in your voice'), tFol = at('Every follow-up'), tForg = at('not one forgotten'), tYou = at('And you?');
  pal(0, P.night); pal(tWork, { ...P.dawn, dur: 0.9 });
  FX.amb.push({ t0: 0, t1: tYou, kind: 'birds', gain: 0.9 });
  mus(0, 'dawn'); mus(tWork - 0.05, 'lift');
  add(S(root, tA, tYou - 0.05, { enter: 'fade', enterDur: 0.5, capShift: -330 }, (n) => {
    // left column copy
    const clock = txt(n, '7:00', { x: 170, y: 250, a: 'left', size: 210, weight: 700, ls: -0.04, style: 'rise' });
    const am = txt(n, 'AM · TUESDAY', { x: 182, y: 486, a: 'left', size: 30, weight: 500, cls: 'mono', color: '#aab4ff', style: 'fade', stagger: 0.08 });
    const l1 = txt(n, 'LinkedIn: not opened\nin *two* *days.*', { x: 170, y: 560, a: 'left', size: 66, ls: -0.02, stagger: 0.05 });
    const l2 = txt(n, 'But it\'s been _working_\n_all_ _night._', { x: 170, y: 250, a: 'left', size: 104, stagger: 0.07 });
    const beats = [
      [tNew, '*New* *connections*'], [tAcc, 'accepted while\nyou _slept._'], [tRep, 'Replies, waiting in\n*one* *inbox.*'],
      [tView, 'Profile viewers?\nAlready messaged.'], [tVoice, 'In _your_ _voice._'], [tFol, 'Every follow-up: *sent.*'], [tForg, 'Not one ^forgotten.^'],
    ].map(([t, s]) => ({ t, k: txt(n, s, { x: 170, y: 0, a: 'left', size: 92, stagger: 0.05 }) }));
    cue(0.05, 'dawn_swell', 0.7); cue(0.2, 'tick_soft', 0.5);
    cue(tWork, 'impact_soft', 0.9); cue(tWork + 0.05, 'shimmer', 0.6);
    // phone
    const ph = el('div', 'phone', n); css(ph, { left: '1180px', top: '100px' });
    el('div', 'isl', ph);
    const scr = el('div', 'scr', ph);
    const glow = el('div', '', scr); css(glow, { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%,rgba(255,170,110,.9),transparent 65%)' });
    const time = el('div', '', scr, '7:00'); css(time, { position: 'absolute', top: '96px', width: '100%', textAlign: 'center', font: '600 112px IS', letterSpacing: '-.03em', color: 'rgba(255,255,255,.95)' });
    const date = el('div', '', scr, 'Tuesday, 21 October'); css(date, { position: 'absolute', top: '74px', width: '100%', textAlign: 'center', font: '600 22px IS', color: 'rgba(255,255,255,.85)' });
    const stack = el('div', '', scr); css(stack, { position: 'absolute', left: 0, right: 0, top: '262px', bottom: 0 });
    const N = [
      [tWork + 0.15, 'Connection accepted', 'Priya Raman accepted your invitation', 'now', 0],
      [tWork + 0.45, 'Connection accepted', 'Jonas Albrecht accepted your invitation', '2m', 1],
      [tAcc + 0.1, 'Connection accepted', 'Tomás Ferreira accepted your invitation', '4m', 4],
      [tRep, 'New reply · Harriet Cole', '“Sure, Thursday works. Send a link?”', '6m', 2],
      [tView + 0.3, 'Message sent · Clara Weiss', 'Viewed your profile yesterday. Personal note sent.', '8m', 3],
      [tFol, 'Follow-up sent · Sofia Marchetti', 'Step 3 of your sequence, on schedule', '9m', 5],
    ];
    const notes = N.map(([t, b, s, i]) => {
      const d = el('div', 'notif', stack, `<div class="ic"></div><div><b>${b}</b><span>${s}</span></div><i>${i}</i>`);
      cue(t, 'notif', 0.75); return { t, d };
    });
    return (t) => {
      // phone motion: float, then a push when it starts working
      const wake = ease.out5(pr(t, tWork - 0.05, 0.6));
      const fl = Math.sin(t * 1.3) * 8;
      css(ph, { transform: `perspective(1600px) rotateY(${-14 + 8 * wake}deg) rotateX(${4 - 2 * wake}deg) translateY(${fl}px) scale(${0.98 + 0.06 * wake})` });
      glow.style.opacity = 0.35 + 0.65 * wake;
      scr.style.filter = `brightness(${0.55 + 0.45 * wake})`;
      // clock text
      clock.update(t); am.update(t - 0.25);
      l1.update(t - 0.45);
      const out1 = ease.in(pr(t, tWork - 0.25, 0.25));
      [clock, am, l1].forEach((k) => css(k.node, { opacity: 1 - out1 }));
      l2.update(t - tWork); css(l2.node, { opacity: 1 - ease.in(pr(t, tNew - 0.2, 0.2)) });
      // beats: only one visible at a time, vertical centre ~430
      beats.forEach((b, i) => {
        const nx = beats[i + 1];
        const vis = t >= b.t - 0.05 && (!nx || t < nx.t);
        b.k.node.style.display = vis ? 'block' : 'none';
        if (vis) { b.k.update(t - b.t); b.k.node.style.top = (430 - b.k.node.offsetHeight / 2) + 'px'; }
      });
      // notifications slide down from the top of the stack
      let y = 0;
      for (let i = notes.length - 1; i >= 0; i--) {
        const { t: nt, d } = notes[i];
        const u = pr(t, nt, 0.5);
        if (u <= 0) { d.style.opacity = 0; continue; }
        const e = ease.spring(u);
        css(d, { opacity: clamp(u * 4), transform: `translateY(${y + (1 - e) * -60}px) scale(${0.9 + 0.1 * ease.out(u)})` });
        y += 112 * clamp(u * 2.2);
      }
    };
  }));

  // ───────────────────── 2. You're on a sales call ─────────────────────
  const tCall = at('You\'re on a sales'), tNot = at('not on LinkedIn'), tGood = at('Sounds good');
  pal(tYou, { ...P.brand }); mus(tYou - 0.05, 'groove');
  add(S(root, tYou - 0.05, tGood - 0.05, { enter: 'whip' }, (n) => {
    const head = txt(n, 'And you?', { y: 96, size: 84, stagger: 0.06 });
    const win = el('div', 'card', n); css(win, { left: '350px', top: '215px', width: '1220px', height: '610px', padding: '26px' });
    const bar = el('div', '', win, '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff5f57;margin-right:8px"></span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#febc2e;margin-right:8px"></span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#28c840"></span>');
    const title = el('div', 'mono', win, 'Discovery call · Northwind × Lumora Health'); css(title, { position: 'absolute', top: '22px', left: '0', right: '0', textAlign: 'center', fontSize: '20px', color: '#c4cbff' });
    const timer = el('div', 'mono', win); css(timer, { position: 'absolute', top: '20px', right: '30px', fontSize: '22px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' });
    const tiles = [0, 1].map((i) => {
      const tl = el('div', '', win); css(tl, { position: 'absolute', top: '74px', left: (26 + i * 590) + 'px', width: '566px', height: '450px', borderRadius: '22px', overflow: 'hidden', background: i ? 'linear-gradient(160deg,#3b2a8a,#1b2560)' : 'linear-gradient(160deg,#1f3a8a,#0f1d4d)' });
      const a = avatar(tl, i ? 0 : 6, 150); css(a, { position: 'absolute', left: '216px', top: '120px' });
      const nm = el('div', '', tl, i ? 'Priya Raman · Lumora Health' : 'You'); css(nm, { position: 'absolute', left: '18px', bottom: '16px', padding: '6px 14px', borderRadius: '10px', background: 'rgba(0,0,0,.45)', font: '600 20px IS' });
      const wave = el('div', '', tl); css(wave, { position: 'absolute', right: '20px', bottom: '22px', display: 'flex', gap: '4px', alignItems: 'center', height: '30px' });
      const bars = [0, 1, 2, 3, 4].map(() => { const b = el('div', '', wave); css(b, { width: '5px', borderRadius: '3px', background: '#7cf0b4' }); return b; });
      return { tl, bars };
    });
    const ctrls = el('div', '', win); css(ctrls, { position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px' });
    ['#2a2f55', '#2a2f55', '#ff4d5e'].forEach((c) => { const b = el('div', '', ctrls); css(b, { width: '58px', height: '58px', borderRadius: '50%', background: c }); });
    const sub = txt(n, 'On a _sales_ _call._ Not on ~LinkedIn.~', { y: 850, size: 60, stagger: 0.05 });
    cue(tCall, 'pop', 0.6); cue(tNot + 0.3, 'swipe', 0.5);
    return (t, T) => {
      head.update(t);
      const u = ease.out5(pr(t, 0.1, 0.6));
      css(win, { transform: `translateY(${(1 - u) * 60}px) scale(${0.94 + 0.06 * u})`, opacity: u });
      const sec = 32 * 60 + 14 + Math.floor(T - tYou);
      timer.innerHTML = `<span style="width:12px;height:12px;border-radius:50%;background:#ff4d5e;box-shadow:0 0 12px #ff4d5e"></span>${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      tiles.forEach(({ bars }, i) => bars.forEach((b, k) => { const talk = i === 1 ? (Math.sin(T * 2.1) > -0.2) : (Math.sin(T * 2.1) <= -0.2); const h = talk ? 8 + 20 * Math.abs(Math.sin(T * (9 + k * 2.3) + k)) : 5; b.style.height = h + 'px'; }));
      sub.update(T - tCall);
      head.node.style.opacity = 1;
    };
  }));

  // ───────────────────── 3. A normal Tuesday with Spurly ─────────────────────
  const tTue = at('normal Tuesday'), tSp = at('with Spurly'), tStay = at('Stay with me');
  add(S(root, tGood - 0.05, tStay - 0.05, { enter: 'zoom' }, (n) => {
    const q = txt(n, 'Sounds good, *right?*', { y: 190, size: 96, stagger: 0.06 });
    const cal = el('div', 'card light', n); css(cal, { left: '720px', top: '330px', width: '220px', height: '240px', overflow: 'hidden', textAlign: 'center' });
    const ctop = el('div', '', cal, 'TUE'); css(ctop, { background: 'linear-gradient(135deg,#4c6ef5,#7966ff)', color: '#fff', font: '700 34px IS', letterSpacing: '.12em', padding: '14px 0' });
    const cday = el('div', '', cal, '21'); css(cday, { font: '700 128px IS', color: '#0b1030', letterSpacing: '-.04em', marginTop: '-2px' });
    const lock = el('div', '', n); css(lock, { position: 'absolute', left: '990px', top: '360px', display: 'flex', alignItems: 'center', gap: '24px' });
    const mk = el('img', '', lock); mk.src = 'mark.png'; css(mk, { height: '170px' });
    const wm = el('div', '', lock, 'Spurly'); css(wm, { font: '700 150px IS', letterSpacing: '-.04em' });
    const line = txt(n, 'Just a _normal_ _Tuesday._', { y: 700, size: 80, stagger: 0.06 });
    cue(tTue - 0.05, 'pop', 0.7); cue(tSp, 'logo_hit', 1.0);
    return (t, T) => {
      q.update(t);
      const c = ease.back(pr(T, tTue - 0.15, 0.5));
      css(cal, { transform: `perspective(900px) rotateX(${(1 - c) * 80}deg) scale(${0.6 + 0.4 * c})`, opacity: clamp(c * 3) });
      const l = ease.out5(pr(T, tSp, 0.6));
      css(lock, { opacity: clamp(l * 2), transform: `translateX(${(1 - l) * 80}px) scale(${0.9 + 0.1 * l})` });
      const slide = ease.inout(pr(T, tSp, 0.6));
      css(cal, { left: (720 - 180 * slide) + 'px' }); css(lock, { left: (990 - 160 * slide) + 'px' });
      line.update(T - tTue + 0.2);
    };
  }));

  // ───────────────────── 4. Five things that change (open loop) ─────────────────────
  const tFive = at('five things'), tNum5 = at('And number five?'), tPeople = at('People honestly'), tSee = at('until they see it'), tHon = at('Now be honest');
  add(S(root, tStay - 0.05, tHon - 0.05, { enter: 'whip' }, (n) => {
    const h = txt(n, 'The *5* *things* that change', { y: 150, size: 88, stagger: 0.06 });
    const row = el('div', '', n); css(row, { position: 'absolute', left: '50%', top: '380px', transform: 'translateX(-50%)', display: 'flex', gap: '34px' });
    const labels = ['Finding leads', 'Writing', 'Follow-ups', 'Conversations', '???'];
    const tiles = labels.map((l, i) => {
      const c = el('div', 'card', row); css(c, { position: 'relative', width: '270px', height: '320px', padding: '30px 28px' });
      const num = el('div', '', c, '0' + (i + 1)); css(num, { font: '700 110px IS', letterSpacing: '-.05em', lineHeight: 1 });
      if (i < 4) num.style.cssText += ';background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent';
      const lb = el('div', '', c, i < 4 ? l : ''); css(lb, { marginTop: '40px', font: '600 30px IS', color: '#dfe3ff' });
      if (i === 4) {
        num.style.color = 'rgba(255,255,255,.25)';
        const lk = icon('lock', 96, '#fff', c); css(lk, { position: 'absolute', left: '87px', top: '150px' });
        c.style.border = '2px solid transparent';
        c.style.background = 'linear-gradient(#0d1033,#0d1033) padding-box, linear-gradient(120deg,#7966ff,#38bdf8,#f472b6,#7966ff) border-box';
        c.style.backgroundSize = '100% 100%, 300% 300%';
        return { c, lk };
      }
      return { c };
    });
    const tease = txt(n, 'People _don\'t_ _believe_ *#5*\nuntil they see it.', { y: 770, size: 66, stagger: 0.05 });
    tiles.forEach((_, i) => cue(tFive - 0.1 + i * 0.12, 'tick_ui', 0.55));
    cue(tNum5, 'riser_short', 0.7); cue(tPeople, 'lock_rattle', 0.8); cue(tSee, 'boom_soft', 0.6);
    return (t, T) => {
      h.update(t);
      tiles.forEach(({ c, lk }, i) => {
        const u = ease.back(pr(T, tFive - 0.2 + i * 0.12, 0.5));
        let tr = `translateY(${(1 - u) * 120}px) scale(${0.85 + 0.15 * u})`;
        if (i === 4) {
          const z = ease.inout(pr(T, tNum5, 0.6));
          tr += ` scale(${1 + 0.18 * z})`;
          c.style.backgroundPosition = `0 0, ${(T * 40) % 300}% 50%`;
          const [sx] = (T > tPeople && T < tPeople + 0.6) ? [Math.sin(T * 80) * 10 * (1 - (T - tPeople) / 0.6)] : [0];
          lk.style.transform = `rotate(${sx}deg)`;
          c.style.boxShadow = `0 0 ${60 * z}px rgba(121,102,255,${0.6 * z})`;
        } else {
          const dim = ease.inout(pr(T, tNum5, 0.5));
          c.style.opacity = clamp(u * 3) * (1 - 0.55 * dim);
        }
        c.style.transform = tr;
        if (i === 4) c.style.opacity = clamp(u * 3);
      });
      tease.update(T - tPeople);
    };
  }));

  // ───────────────────── 5. Now be honest (glitch into cold) ─────────────────────
  const tToday = at('your LinkedIn today'), tSearch = find('Search', { keep: true }).s;
  pal(tHon - 0.05, { ...P.cold, dur: 0.3 }); mus(tHon - 0.08, 'stop'); mus(tSearch - 0.05, 'grind');
  add(S(root, tHon - 0.05, tSearch - 0.08, { enter: 'glitch' }, (n) => {
    const a = txt(n, 'Now, be _honest._', { y: 330, size: 120, stagger: 0.08 });
    const b = txt(n, 'Your LinkedIn *today:*', { y: 520, size: 96, stagger: 0.06, color: '#b8bfd6' });
    cue(tHon - 0.08, 'scratch', 0.9);
    return (t, T) => { a.update(t); b.update(T - tToday); };
  }));

  // ───────────────────── 6. The grind montage ─────────────────────
  const steps = [['Search', 'search'], ['scroll', 'scroll'], ['copy', 'copy'], ['paste', 'paste'], ['send', 'send']].map(([w, ic]) => ({ t: at(w), w, ic }));
  const tForget = at('Forget to follow'), tGuilty = at('feel guilty'), tRepeat = at('repeat'), tFam = at('Sound familiar'), tHire = at('Or you hire');
  add(S(root, tSearch - 0.08, tHire - 0.05, { enter: 'cut' }, (n) => {
    const words = steps.map((s, i) => {
      const g = el('div', '', n); css(g, { position: 'absolute', left: 0, right: 0, top: '300px', textAlign: 'center' });
      const ic = icon(s.ic, 120, '#8f98b8', g); css(ic, { margin: '0 auto 10px' });
      const w = el('div', '', g, s.w.toUpperCase() + '.'); css(w, { font: '700 230px IS', letterSpacing: '-.045em', color: '#eef0f7', lineHeight: 1 });
      cue(s.t - 0.02, 'slam', 0.85); cue(s.t + 0.02, ['type', 'scroll_tick', 'click', 'click', 'send_swoosh'][i], 0.7);
      return { g, t: s.t };
    });
    const counter = el('div', 'mono', n); css(counter, { position: 'absolute', left: '60px', top: '50px', fontSize: '26px', color: '#8d93ad' });
    // follow-up sticky note
    const note = el('div', '', n, '<div style="font:600 30px IS;color:#3b3200">Follow up with Priya</div><div style="font:500 22px IS;color:#6b5c10;margin-top:8px">(from 2 weeks ago)</div>');
    css(note, { position: 'absolute', left: '760px', top: '260px', width: '400px', padding: '34px 30px', background: '#ffe27a', borderRadius: '6px', boxShadow: '0 30px 60px rgba(0,0,0,.5)' });
    const fgt = txt(n, 'Forget to follow up.', { y: 640, size: 78, stagger: 0.05 });
    const gl = txt(n, 'Feel _guilty._', { y: 400, size: 150, stagger: 0.08 });
    const rp = el('div', '', n); css(rp, { position: 'absolute', left: 0, right: 0, top: '260px', textAlign: 'center' });
    const rpi = icon('loop', 260, '#ff5d6c', rp); css(rpi, { margin: '0 auto' });
    const rpt = el('div', '', rp, 'REPEAT.'); css(rpt, { font: '700 170px IS', letterSpacing: '-.04em', color: '#eef0f7', marginTop: '10px' });
    const fam = txt(n, 'Sound _familiar?_', { y: 430, size: 140, stagger: 0.08 });
    cue(tForget, 'paper', 0.8); cue(tGuilty, 'boom_soft', 0.6); cue(tRepeat, 'slam', 0.8); cue(tRepeat + 0.05, 'loop_whoosh', 0.6); cue(tFam, 'pop', 0.5);
    return (t, T) => {
      let sx = 0, sy = 0;
      words.forEach((w, i) => {
        const nx = words[i + 1];
        const end = nx ? nx.t : tForget;
        const vis = T >= w.t - 0.03 && T < end - 0.02;
        w.g.style.display = vis ? 'block' : 'none';
        if (vis) {
          const u = ease.out5(pr(T, w.t - 0.03, 0.18));
          w.g.style.transform = `scale(${1.6 - 0.6 * u})`; w.g.style.opacity = clamp(u * 3);
          const [a, b] = shake(T, w.t, 16, 0.3); sx += a; sy += b;
        }
      });
      counter.textContent = T < tForget ? `hour ${1 + Math.floor((T - tSearch) * 1.4)} of outreach` : '';
      const nv = T >= tForget - 0.05 && T < tGuilty - 0.03;
      note.style.display = nv ? 'block' : 'none'; fgt.node.style.display = nv ? 'block' : 'none';
      if (nv) {
        const u = ease.spring(pr(T, tForget - 0.05, 0.6));
        note.style.transform = `translateY(${(1 - u) * -500}px) rotate(${-8 + 4 * u}deg)`;
        const fall = ease.in(pr(T, tForget + 0.55, 0.35));
        note.style.transform += ` translateY(${fall * 700}px) rotate(${fall * 30}deg)`;
        fgt.update(T - tForget);
      }
      const gv = T >= tGuilty - 0.03 && T < tRepeat - 0.03; gl.node.style.display = gv ? 'block' : 'none'; if (gv) gl.update(T - tGuilty);
      const rv = T >= tRepeat - 0.03 && T < tFam - 0.03; rp.style.display = rv ? 'block' : 'none';
      if (rv) { const u = ease.out5(pr(T, tRepeat - 0.03, 0.2)); rp.style.transform = `scale(${1.5 - 0.5 * u})`; rpi.style.transform = `rotate(${(T - tRepeat) * 540}deg)`; const [a, b] = shake(T, tRepeat, 16, 0.3); sx += a; sy += b; }
      const fv = T >= tFam - 0.03; fam.node.style.display = fv ? 'block' : 'none'; if (fv) fam.update(T - tFam);
      n.style.translate = `${sx}px ${sy}px`;
    };
  }));

  // ───────────────────── 7. Or hire an SDR ─────────────────────
  const t60 = at('60'), t80 = at('$80,000'), tBase = at('just the base salary'), tMonths = at('wait months'), tDIY = at('Do it yourself'), tFortune = at('pay a fortune'), tChoice = at('That\'s been the choice'), tBut = at('But here\'s what');
  mus(tHire - 0.05, 'tension');
  FX.amb.push({ t0: tSearch - 0.1, t1: tHire, kind: 'office', gain: 1 });
  add(S(root, tHire - 0.05, tDIY - 0.05, { enter: 'zoom' }, (n) => {
    const h = txt(n, 'Or hire an *SDR.*', { y: 120, size: 96, stagger: 0.06 });
    const card = el('div', 'card', n); css(card, { left: '330px', top: '270px', width: '1260px', height: '520px', padding: '50px 60px' });
    const lab = el('div', 'mono', card, 'SALES DEVELOPMENT REP · BASE SALARY'); css(lab, { fontSize: '24px', color: '#9aa3c7' });
    const money = el('div', '', card); css(money, { whiteSpace: 'nowrap', font: '700 132px IS', letterSpacing: '-.04em', marginTop: '18px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' });
    const per = el('div', '', card, 'per year'); css(per, { font: '500 34px IS', color: '#c5cbe6', marginTop: '6px' });
    const chips = el('div', '', card); css(chips, { display: 'flex', gap: '16px', marginTop: '40px' });
    const c1 = el('div', 'chip', chips, 'Base salary only'); const c2 = el('div', 'chip', chips, '+ months to ramp up');
    css(c2, { background: 'rgba(255,93,108,.14)', borderColor: 'rgba(255,93,108,.45)', color: '#ffc2c8' });
    const ramp = el('div', '', card); css(ramp, { position: 'absolute', left: '60px', right: '60px', bottom: '46px', height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,.08)', overflow: 'hidden' });
    const rampF = el('div', '', ramp); css(rampF, { height: '100%', width: '0%', background: 'linear-gradient(90deg,#ff5d6c,#ffb547)', borderRadius: '6px' });
    cue(t60, 'counter', 0.7); cue(t80, 'cash', 0.9); cue(tBase, 'pop', 0.5); cue(tMonths, 'pop_low', 0.6);
    return (t, T) => {
      h.update(t);
      const u = ease.out5(pr(t, 0.15, 0.6)); css(card, { opacity: u, transform: `translateY(${(1 - u) * 50}px)` });
      let v;
      if (T < t60) v = 0; else if (T < t80) v = 60000 * ease.out(pr(T, t60, Math.max(0.2, t80 - t60))); else v = 60000;
      const v2 = T < t80 ? null : 60000 + 20000 * ease.out(pr(T, t80, 0.5));
      money.innerHTML = v2 == null ? fmtMoney(v) : `$60,000 – <span style="background:linear-gradient(100deg,#ff8a8a,#ffb547);-webkit-background-clip:text;background-clip:text;color:transparent">${fmtMoney(v2)}</span>`;
      [[c1, tBase], [c2, tMonths]].forEach(([c, tt]) => { const e = ease.back(pr(T, tt, 0.4)); css(c, { opacity: clamp(e * 3), transform: `scale(${0.7 + 0.3 * e})` }); });
      rampF.style.width = (100 * ease.out(pr(T, tMonths, 2.2)) * 0.45) + '%';
    };
  }));

  // ───────────────────── 8. DIY vs fortune ─────────────────────
  add(S(root, tDIY - 0.05, tBut - 0.05, { enter: 'whip' }, (n) => {
    const mk = (x, ic, title, sub, t0) => {
      const c = el('div', 'card', n); css(c, { left: x + 'px', top: '250px', width: '640px', height: '520px', padding: '56px', textAlign: 'center' });
      const i = icon(ic, 140, '#c5cbe6', c); css(i, { margin: '10px auto 30px' });
      const tt = el('div', '', c, title); css(tt, { font: '700 72px IS', letterSpacing: '-.03em' });
      const ss = el('div', '', c, sub); css(ss, { font: '500 32px IS', color: '#9aa3c7', marginTop: '14px' });
      const st = el('div', '', c, ICON.x); css(st, { position: 'absolute', left: '50%', top: '50%', width: '360px', height: '360px', margin: '-180px 0 0 -180px', color: '#ff5d6c', filter: 'drop-shadow(0 0 30px rgba(255,93,108,.6))' });
      st.firstChild.style.width = '100%'; st.firstChild.style.height = '100%';
      return { c, st, t0 };
    };
    const a = mk(260, 'hourglass', 'Do it yourself', 'Hours, every single week', tDIY);
    const b = mk(1020, 'dollar', 'Pay a fortune', '$60K–$80K before results', tFortune);
    const vs = el('div', '', n, 'or'); css(vs, { position: 'absolute', left: '0', right: '0', top: '470px', textAlign: 'center', font: 'italic 500 56px NR', color: '#9aa3c7' });
    const ch = txt(n, 'That\'s been *the* *choice.*', { y: 860, size: 72, stagger: 0.06 });
    cue(tFortune, 'pop', 0.6); cue(tChoice, 'stamp', 0.9); cue(tChoice + 0.18, 'stamp', 0.8);
    return (t, T) => {
      [a, b].forEach((k, i) => {
        const u = ease.back(pr(T, k.t0 - 0.05, 0.5));
        css(k.c, { opacity: clamp(u * 3), transform: `translateY(${(1 - u) * 80}px) scale(${0.9 + 0.1 * u})` });
        const s = ease.out5(pr(T, tChoice + i * 0.18, 0.25));
        css(k.st, { opacity: clamp(s * 3), transform: `scale(${2.2 - 1.2 * s}) rotate(${-10 + 10 * s}deg)` });
        k.c.style.filter = `saturate(${1 - 0.7 * s}) brightness(${1 - 0.25 * s})`;
      });
      ch.update(T - tChoice);
      const [sx, sy] = shake(T, tChoice, 12, 0.3); const [sx2, sy2] = shake(T, tChoice + 0.18, 12, 0.3);
      n.style.translate = `${sx + sx2}px ${sy + sy2}px`;
    };
  }));

  part2(root, add, { S, txt, icon, avatar, shake, pal, mus, P, ICON, tBut });
  return out;
}
