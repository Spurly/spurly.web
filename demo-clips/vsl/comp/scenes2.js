import { W, H, clamp, lerp, ease, pr, el, css, at, find, findAfter, cue, kinetic, setSrc, FX } from './lib.js';

// ───────── recorded app clips ─────────
const metaOf = async (n) => (await fetch(`/meta/${n}.json`)).json();
const shotsOf = async (n) => (await fetch(`/meta/shots-${n}.json`)).json();
const CLIPS = {};
for (const n of ['find', 'follow', 'invitations', 'claude']) {
  const m = await metaOf(n), s = await shotsOf(n);
  CLIPS[n] = mkClip(n, m.marks, s.keys, m.frames);
}
const ms = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v]));
CLIPS.signals = mkClip('signals', ms({ viewers: 0, followers: 2350, followersPicked: 4083, posts: 4983, postsSearch: 7050, postsResults: 7067, picked: 9417, imported: 10317, jobs: 11217, jobsSearch: 12950, jobsResults: 12967, end: 14667 }), [
  { at: 0, cx: 860, cy: 420, z: 1.22 }, { at: 2.2, cx: 860, cy: 470, z: 1.32 },
  { at: 2.36, cx: 800, cy: 500, z: 1.0 }, { at: 3.4, cx: 800, cy: 520, z: 1.0 }, { at: 4.0, cx: 800, cy: 540, z: 1.5 }, { at: 4.95, cx: 800, cy: 545, z: 1.55 },
  { at: 5.0, cx: 900, cy: 260, z: 1.35 }, { at: 6.9, cx: 900, cy: 230, z: 1.45 }, { at: 7.3, cx: 920, cy: 720, z: 1.45 }, { at: 9.4, cx: 940, cy: 700, z: 1.5 }, { at: 10.0, cx: 1150, cy: 640, z: 1.6 }, { at: 11.2, cx: 1150, cy: 640, z: 1.6 },
  { at: 11.23, cx: 800, cy: 500, z: 1.0 }, { at: 12.9, cx: 900, cy: 520, z: 1.0 }, { at: 13.6, cx: 900, cy: 840, z: 1.42 }, { at: 14.6, cx: 900, cy: 860, z: 1.45 },
], 880);
CLIPS.inbox = mkClip('inbox', ms({ inbox: 0, open: 1150, typed: 3933, dash: 4633, analytics: 6533, end: 8133 }), [
  { at: 0, cx: 800, cy: 500, z: 1.0 }, { at: 0.9, cx: 760, cy: 460, z: 1.12 }, { at: 1.5, cx: 1000, cy: 420, z: 1.3 }, { at: 2.6, cx: 1000, cy: 520, z: 1.3 }, { at: 3.3, cx: 1080, cy: 820, z: 1.55 }, { at: 4.6, cx: 1080, cy: 830, z: 1.6 },
  { at: 4.64, cx: 800, cy: 500, z: 1.0 }, { at: 5.6, cx: 900, cy: 420, z: 1.05 }, { at: 6.6, cx: 900, cy: 290, z: 1.3 }, { at: 7.2, cx: 1250, cy: 520, z: 1.65 }, { at: 8.1, cx: 1290, cy: 560, z: 1.75 },
], 488);

function mkClip(name, marks, keys, n) {
  const mk = {}; for (const k in marks) mk[k] = marks[k] / 1000;
  const K = keys.map((k) => [(typeof k.at === 'string' ? mk[k.at] : k.at) + (k['+'] || 0), k.cx, k.cy, k.z]).sort((a, b) => a[0] - b[0]);
  return {
    name, marks: mk, n,
    m: (k, d = 0) => mk[k] + d,
    cam(t) {
      if (t <= K[0][0]) return K[0].slice(1);
      for (let i = 0; i < K.length - 1; i++) {
        const [t0, x0, y0, z0] = K[i], [t1, x1, y1, z1] = K[i + 1];
        if (t <= t1) { const u = t1 > t0 ? ease.smooth((t - t0) / (t1 - t0)) : 1; return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * u)]; }
      }
      return K[K.length - 1].slice(1);
    },
    src(t) { const i = Math.round(clamp(t, 0, (n - 1) / 60) * 60); return `/frames/${name}/f${String(i).padStart(5, '0')}.jpg`; },
  };
}

// a browser window that plays a clip with its camera
function appWin(parent, { x = 360, y = 150, w = 1200, url = 'getspurly.com/hub' } = {}) {
  const h = Math.round(w * 0.625), BAR = 40;
  const box = el('div', 'appwin', parent);
  css(box, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + BAR + 'px', borderRadius: '20px', overflow: 'hidden', background: '#141838',
    boxShadow: '0 50px 110px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.12), 0 0 90px rgba(92,108,255,.18)' });
  const bar = el('div', '', box, '<i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>');
  css(bar, { height: BAR + 'px', display: 'flex', alignItems: 'center', gap: '9px', padding: '0 18px', background: 'linear-gradient(#1b2050,#161a44)' });
  [...bar.querySelectorAll('i')].forEach((i) => css(i, { width: '12px', height: '12px', borderRadius: '50%', display: 'block' }));
  const pill = el('div', 'mono', bar, '🔒 ' + url); css(pill, { position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '8px', padding: '3px 18px', borderRadius: '12px', background: 'rgba(255,255,255,.08)', fontSize: '16px', color: '#c3c9f5' });
  const view = el('div', '', box); css(view, { position: 'relative', width: w + 'px', height: h + 'px', overflow: 'hidden', background: '#f6f7fb' });
  const imgs = [el('img', '', view), el('img', '', view)];
  imgs.forEach((im) => css(im, { position: 'absolute', left: 0, top: 0, maxWidth: 'none' }));
  function place(im, clip, t) {
    let [cx, cy, z] = clip.cam(t);
    const vw = 1600 / z, vh = 1000 / z;
    cx = clamp(cx, vw / 2, 1600 - vw / 2); cy = clamp(cy, vh / 2, 1000 - vh / 2);
    const s = w / vw;
    css(im, { width: 1600 * s + 'px', height: 1000 * s + 'px', left: (w / 2 - cx * s) + 'px', top: (h / 2 - cy * s) + 'px' });
    setSrc(im, clip.src(t));
  }
  return {
    box, pill, w, h,
    show(clip, t, prev = null, mix = 1) {
      place(imgs[0], clip, t); imgs[0].style.opacity = 1;
      if (prev && mix < 1) { place(imgs[1], prev[0], prev[1]); imgs[1].style.display = 'block'; imgs[1].style.opacity = 1 - mix; }
      else imgs[1].style.display = 'none';
    },
  };
}

// piecewise clip time: map = [[T, clipT], ...]; equal T = jump (dissolve)
function clipTime(map, T) {
  if (T <= map[0][0]) return { t: map[0][1] };
  for (let i = 0; i < map.length - 1; i++) {
    const [a, ca] = map[i], [b, cb] = map[i + 1];
    if (b === a) continue;
    if (T <= b) {
      const t = ca + (cb - ca) * ((T - a) / (b - a));
      // dissolve right after a jump
      if (i > 0 && map[i - 1][0] === a && T - a < 0.2) return { t, prev: map[i - 1][1] + (T - a) * 0.3, mix: ease.smooth((T - a) / 0.2) };
      return { t };
    }
  }
  const [a, ca] = map[map.length - 1];
  return { t: ca + (T - a) };
}

export function part2(root, add, k) {
  const { S, txt, icon, avatar, shake, pal, mus, P, ICON, tBut } = k;
  const head = (n, beats, o = {}) => {   // one kinetic headline at a time, top of frame
    const ks = beats.map(([t, s, oo = {}]) => ({ t, k: txt(n, s, { y: o.y ?? 52, size: o.size ?? 60, stagger: 0.045, ...oo }) }));
    return (T) => ks.forEach((b, i) => {
      const nx = ks[i + 1]; const vis = T >= b.t - 0.05 && (!nx || T < nx.t - 0.02);
      b.k.node.style.display = vis ? 'block' : 'none'; if (vis) b.k.update(T - b.t);
    });
  };
  const winScene = (t0, t1, o, extra) => add(S(root, t0, t1, { enter: o.enter ?? 'whip', capShift: 0, ...o.sopts }, (n) => {
    const win = appWin(n, { url: o.url, y: o.y ?? 136, w: o.w ?? 1200, x: o.x ?? (W - (o.w ?? 1200)) / 2 });
    const hd = head(n, o.heads || []);
    (o.cues || []).forEach(([t, nm, g]) => cue(t, nm, g ?? 0.6));
    const ex = extra ? extra(n, win) : null;
    return (t, T) => {
      const r = clipTime(o.map, T);
      win.show(CLIPS[o.clip], r.t, r.prev != null ? [CLIPS[o.clip], r.prev] : null, r.mix ?? 1);
      const u = ease.out5(pr(t, 0, 0.5));
      win.box.style.transform = `translateY(${(1 - u) * 30}px)`;
      hd(T); if (ex) ex(t, T);
    };
  }));
  const titleCard = (t0, t1, num, line, o = {}) => add(S(root, t0, t1, { enter: o.enter ?? 'zoom', capShift: 0 }, (n) => {
    const big = el('div', '', n, num); css(big, { position: 'absolute', left: 0, right: 0, top: '170px', textAlign: 'center', font: '700 380px/1 IS', letterSpacing: '-.06em', background: 'linear-gradient(180deg,#a9b6ff,#6d5cff 70%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 20px 60px rgba(109,92,255,.45))' });
    const lab = el('div', 'mono', n, o.label ?? 'CHANGE ' + num + ' / 05'); css(lab, { position: 'absolute', left: 0, right: 0, top: '120px', textAlign: 'center', fontSize: '26px', color: '#9fb0ff', letterSpacing: '.3em' });
    const ln = txt(n, line, { y: 640, size: 86, stagger: 0.06 });
    cue(t0 - 0.02, 'slam', 0.7); cue(t0 + 0.05, 'shimmer', 0.4);
    const prog = el('div', '', n); css(prog, { position: 'absolute', left: '50%', top: '800px', transform: 'translateX(-50%)', display: 'flex', gap: '14px' });
    const dots = [1, 2, 3, 4, 5].map((i) => { const d = el('div', '', prog); css(d, { width: '64px', height: '8px', borderRadius: '4px', background: i <= +num ? 'linear-gradient(90deg,#7c93ff,#a78bfa)' : 'rgba(255,255,255,.14)' }); return d; });
    return (t, T) => {
      const u = ease.out5(pr(t, 0, 0.45));
      big.style.transform = `scale(${1.25 - 0.25 * u}) translateY(${(1 - u) * 30}px)`; big.style.opacity = clamp(u * 2);
      lab.style.opacity = clamp((t - 0.15) * 4);
      ln.update(T - (o.lineAt ?? t0 + 0.2));
      dots.forEach((d, i) => { const e = ease.back(pr(t, 0.2 + i * 0.05, 0.3)); d.style.transform = `scaleX(${e})`; });
    };
  }));

  // ───────────── 9. Insight: they raise their hand (light) ─────────────
  const tBest = at('Your best leads'), tView = at('They view your profile'), tFol = at('they follow your page'), tPost = at('they post about'), tHire = at('Their company just started hiring'), tNobody = at('almost nobody acts'), tDoes = at('Spurly does');
  pal(tBut - 0.05, { ...P.light, dur: 0.4 }); mus(tBut - 0.1, 'airy');
  add(S(root, tBut - 0.05, tDoes - 0.06, { enter: 'zoom', capDark: true }, (n) => {
    const a = txt(n, 'Here\'s what _nobody_ tells you.', { y: 470, size: 92, stagger: 0.06, color: '#0b1030' });
    const b = txt(n, 'Your best leads are\n*already* *raising* *their* *hand.*', { y: 90, size: 80, stagger: 0.05, color: '#0b1030' });
    b.node.querySelectorAll('.kw.hl').forEach((e) => (e.style.background = 'linear-gradient(100deg,#3b5bdb,#7966ff)', e.style.webkitBackgroundClip = 'text'));
    const cards = [
      [tView, 'eye', 'Viewed your profile', 'Clara Weiss · Head of Marketing', '2h ago', 3],
      [tFol, 'plus', 'Followed your page', 'Mateo Ruiz · Founder & CEO', '5h ago', 1],
      [tPost, 'chat', 'Posted about your problem', 'Leah Fischer · “outbound is hard”', '1d ago', 4],
      [tHire, 'brief', 'Company started hiring', 'Pinewire Analytics · 2 SDR roles', '1d ago', 6],
    ].map(([t, ic, title, sub, when, av], i) => {
      const c = el('div', 'card light', n); css(c, { left: (i % 2 ? 990 : 330) + 'px', top: (i < 2 ? 330 : 590) + 'px', width: '600px', height: '200px', padding: '30px 34px', display: 'flex', gap: '24px', alignItems: 'center' });
      const ib = el('div', '', c); css(ib, { width: '84px', height: '84px', borderRadius: '24px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4c6ef5,#7966ff)', boxShadow: '0 12px 26px rgba(76,110,245,.4)' });
      icon(ic, 44, '#fff', ib);
      const tx = el('div', '', c, `<div style="font:700 34px IS;color:#0b1030;letter-spacing:-.01em">${title}</div><div style="font:500 24px IS;color:#565d86;margin-top:8px">${sub}</div>`);
      const wh = el('div', 'mono', c, when); css(wh, { position: 'absolute', right: '26px', top: '22px', fontSize: '18px', color: '#8a90b5' });
      const bar = el('div', '', c); css(bar, { position: 'absolute', left: '34px', right: '34px', bottom: '18px', height: '6px', borderRadius: '3px', background: '#e7e9f7', overflow: 'hidden' });
      const fill = el('div', '', bar); css(fill, { height: '100%', width: '100%', background: 'linear-gradient(90deg,#34d399,#38bdf8)' });
      cue(t, 'pop', 0.7);
      return { c, t, fill, wh };
    });
    cue(tBest, 'shimmer', 0.5); cue(tNobody, 'tick_soft', 0.5); cue(tNobody + 0.9, 'boom_soft', 0.4);
    return (t, T) => {
      a.update(t); css(a.node, { opacity: 1 - ease.in(pr(T, tBest - 0.25, 0.25)) });
      b.update(T - tBest);
      cards.forEach(({ c, t: ct, fill, wh }) => {
        const e = ease.back(pr(T, ct - 0.05, 0.45));
        const drain = ease.inout(pr(T, tNobody + 0.1, 1.6));
        css(c, { opacity: clamp(e * 3) * (1 - 0.45 * drain), transform: `translateY(${(1 - e) * 70}px) scale(${0.86 + 0.14 * e})`, filter: `grayscale(${drain})` });
        fill.style.width = (100 - 100 * drain) + '%';
      });
    };
  }));

  // ───────────── 10. Spurly does. ─────────────
  const tAI = at('Spurly is your AI SDR'), tFinds = at('It finds the right people'), tWrites = at('writes to them in your voice'), tFollows = at('follows up until they reply'), t247 = at('24/7'), tIf = at('If you already know');
  pal(tDoes - 0.06, { ...P.brand, dur: 0.2 }); mus(tNobody + 0.2, 'build'); mus(tDoes - 0.04, 'drive');
  add(S(root, tDoes - 0.06, tIf - 0.05, { enter: 'zoom', flash: (lt) => (lt < 0.25 ? 0.3 * (1 - lt / 0.25) : 0) }, (n) => {
    const lock = el('div', '', n); css(lock, { position: 'absolute', left: 0, right: 0, top: '170px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px' });
    const mk = el('img', '', lock); mk.src = 'mark.png'; css(mk, { height: '190px', filter: 'drop-shadow(0 20px 50px rgba(121,102,255,.55))' });
    const wm = el('div', '', lock, 'Spurly <span style="font-family:NR;font-style:italic;font-weight:500;color:#c9d2ff">does.</span>'); css(wm, { font: '700 170px IS', letterSpacing: '-.045em' });
    const tag = txt(n, 'Your *AI* *SDR* for LinkedIn.', { y: 440, size: 76, stagger: 0.05 });
    const pills = [[tFinds, 'search', 'Finds the right people'], [tWrites, 'pen', 'Writes in your voice'], [tFollows, 'loop', 'Follows up until they reply']].map(([t, ic, s], i) => {
      const p = el('div', 'card', n); css(p, { left: (210 + i * 510) + 'px', top: '600px', width: '480px', height: '150px', padding: '0 30px', display: 'flex', alignItems: 'center', gap: '22px', borderRadius: '30px' });
      const ib = el('div', '', p); css(ib, { width: '70px', height: '70px', borderRadius: '20px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4c6ef5,#7966ff)' });
      icon(ic, 36, '#fff', ib);
      el('div', '', p, `<div style="font:700 32px/1.15 IS;letter-spacing:-.01em">${s}</div>`);
      cue(t, 'pop', 0.6); return { p, t };
    });
    const badge = el('div', '', n, '<span style="font:700 64px IS;letter-spacing:-.03em">24/7</span><span style="font:500 26px IS;color:#bfe9d5;margin-left:14px">always on</span>');
    css(badge, { position: 'absolute', left: '50%', top: '800px', padding: '10px 34px', borderRadius: '999px', background: 'rgba(52,211,153,.12)', border: '2px solid rgba(52,211,153,.6)', color: '#7cf0b4', display: 'flex', alignItems: 'center', boxShadow: '0 0 50px rgba(52,211,153,.3)' });
    cue(tDoes - 0.06, 'logo_hit', 1.0); cue(t247, 'impact_soft', 0.8);
    return (t, T) => {
      const u = ease.out5(pr(t, 0, 0.5)); lock.style.transform = `scale(${1.3 - 0.3 * u})`; lock.style.opacity = clamp(u * 3);
      const up = ease.inout(pr(T, tAI - 0.1, 0.5)); lock.style.top = (170 - 70 * up) + 'px'; lock.style.scale = String(1 - 0.35 * up);
      tag.update(T - tAI);
      pills.forEach(({ p, t: pt }) => { const e = ease.back(pr(T, pt - 0.05, 0.45)); css(p, { opacity: clamp(e * 3), transform: `translateY(${(1 - e) * 60}px)` }); });
      const bb = ease.back(pr(T, t247 - 0.05, 0.4)); badge.style.transform = `translateX(-50%) scale(${0.5 + 0.5 * bb})`; badge.style.opacity = clamp(bb * 3);
    };
  }));

  // ───────────── 11. Buttons below + "let me show you" ─────────────
  const tBelow = at('the buttons are right below'), tNotJust = at('But I\'m not just going'), tC1 = at('Change number one');
  add(S(root, tIf - 0.05, tC1 - 0.05, { enter: 'up' }, (n) => {
    const q = txt(n, 'Already know you want this?', { y: 190, size: 84, stagger: 0.05 });
    const row = el('div', '', n); css(row, { position: 'absolute', left: '50%', top: '420px', transform: 'translateX(-50%)', display: 'flex', gap: '30px' });
    const b1 = el('div', '', row, 'Book a call'); css(b1, { padding: '34px 64px', borderRadius: '999px', font: '700 46px IS', background: 'linear-gradient(135deg,#4c6ef5,#7966ff)', boxShadow: '0 20px 60px rgba(92,108,255,.55)' });
    const b2 = el('div', '', row, 'Start free trial'); css(b2, { padding: '34px 64px', borderRadius: '999px', font: '700 46px IS', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.3)' });
    const arr = el('div', '', n, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M5 12l7 7 7-7"/></svg>');
    css(arr, { position: 'absolute', left: '50%', top: '640px', width: '110px', height: '110px', marginLeft: '-55px', color: '#8ea2ff' });
    const lbl = el('div', 'mono', n, 'RIGHT BELOW THIS VIDEO'); css(lbl, { position: 'absolute', left: 0, right: 0, top: '770px', textAlign: 'center', fontSize: '26px', letterSpacing: '.25em', color: '#9fb0ff' });
    const show = txt(n, 'Let me _show_ you.', { y: 420, size: 140, stagger: 0.07 });
    cue(tBelow, 'pop', 0.6); cue(tNotJust, 'whoosh', 0.5); cue(tNotJust + 1.0, 'riser_short', 0.6);
    return (t, T) => {
      q.update(t);
      const e = ease.back(pr(T, tBelow - 0.25, 0.5)); row.style.opacity = clamp(e * 3); row.style.transform = `translateX(-50%) scale(${0.8 + 0.2 * e})`;
      const bob = Math.sin((T - tBelow) * 7) * 14; arr.style.transform = `translateY(${bob}px)`; arr.style.opacity = clamp((T - tBelow) * 4); lbl.style.opacity = arr.style.opacity;
      const out = ease.in(pr(T, tNotJust - 0.1, 0.25));
      q.node.style.opacity = 1 - out; row.style.opacity = clamp(e * 3) * (1 - out); arr.style.opacity = clamp((T - tBelow) * 4) * (1 - out); lbl.style.opacity = arr.style.opacity;
      show.node.style.display = T > tNotJust - 0.05 ? 'block' : 'none'; show.update(T - tNotJust);
    };
  }));

  // ───────────── 12. CHANGE 01: find + signals ─────────────
  const tHunt = at('you never hunt'), tTell = at('Tell Spurly who'), tJob = at('Job title'), tInd = at('industry'), tSize = at('company size'), tLoc = at('location'), tDone = at('Done'), tFinds2 = at('it finds them'),
    tWarm = at('Then it shows you the warm ones'), tWV = at('Who viewed your profile'), tWF = at('Who just followed you'), tWP = at('Who\'s posting'), tWH = at('Which companies are hiring'), tOne = at('One click'), tExist = at('People who already know'), tHalf = at('But finding them'), tC2 = at('Change number two');
  mus(tC1 - 0.05, 'drive');
  titleCard(tC1 - 0.05, tTell - 0.05, '01', 'You never *hunt* for leads again.', { lineAt: tHunt });
  const F = CLIPS.find;
  winScene(tTell - 0.05, tWarm - 0.05, {
    clip: 'find', url: 'getspurly.com/hub/leads',
    map: [[tTell - 0.05, F.m('open', -0.3)], [tJob, F.m('review', 0.2)], [tLoc + 0.4, F.m('filled')], [tLoc + 0.4, F.m('submitted', -0.2)], [tWarm, F.m('end')]],
    heads: [[tTell, 'Tell Spurly who you *sell* *to.*'], [tDone, '*Done.* It finds them.']],
    cues: [[tJob, 'tick_ui'], [tInd, 'tick_ui'], [tSize, 'tick_ui'], [tLoc, 'tick_ui'], [tDone, 'confirm', 0.7]],
  }, (n) => {
    const chips = [[tJob, 'Job title'], [tInd, 'Industry'], [tSize, 'Company size'], [tLoc, 'Location']].map(([t, s], i) => {
      const c = el('div', 'chip', n, s); css(c, { position: 'absolute', left: (180 + i * 410) + 'px', top: '830px', padding: '16px 32px', font: '700 34px IS', background: 'linear-gradient(135deg,rgba(76,110,245,.95),rgba(121,102,255,.95))', border: 'none', boxShadow: '0 16px 40px rgba(76,110,245,.45)' });
      return { c, t };
    });
    return (t, T) => chips.forEach(({ c, t: ct }) => {
      const e = ease.back(pr(T, ct - 0.05, 0.35)); const out = ease.in(pr(T, tDone - 0.1, 0.25));
      css(c, { opacity: clamp(e * 3) * (1 - out), transform: `translateY(${(1 - e) * 40 + out * 30}px) scale(${0.7 + 0.3 * e})` });
    });
  });
  const G = CLIPS.signals;
  winScene(tWarm - 0.05, tHalf - 0.05, {
    clip: 'signals', url: 'getspurly.com/hub/viewers', sopts: { enter: 'zoom' },
    map: [[tWarm - 0.05, G.m('viewers', 0.0)], [tWF - 0.1, G.m('followers', -0.15)], [tWF - 0.1, G.m('followers', 0.25)], [tWP - 0.1, G.m('followersPicked', 0.6)], [tWP - 0.1, G.m('postsSearch', -0.6)], [tWH - 0.1, G.m('postsResults', 0.9)],
      [tWH - 0.1, G.m('jobsResults', 0.1)], [tOne - 0.1, G.m('jobsResults', 1.5)], [tOne - 0.1, G.m('postsResults', 1.0)], [tExist, G.m('imported', 0.1)], [tHalf, G.m('imported', 0.8)]],
    heads: [[tWarm, 'Then it shows you the *warm* *ones.*'], [tWV, '*Who* *viewed* your profile.'], [tWF, 'Who just *followed* you.'], [tWP, 'Who\'s *posting* about your topic.'], [tWH, 'Which companies are *hiring.*'], [tOne, '*One* *click.* They\'re leads.'], [tExist, 'People who _already_ know you.']],
    cues: [[tWV, 'pop'], [tWF, 'pop'], [tWP, 'pop'], [tWH, 'pop'], [tOne, 'click', 0.8], [tOne + 0.15, 'confirm', 0.7]],
  }, (n, win) => {
    const urls = [[tWarm, 'getspurly.com/hub/viewers'], [tWF - 0.1, 'getspurly.com/hub/leads'], [tWP - 0.1, 'getspurly.com/hub/discover'], [tWH - 0.1, 'getspurly.com/hub/discover?tab=jobs'], [tOne - 0.1, 'getspurly.com/hub/discover']];
    return (t, T) => { const u = [...urls].reverse().find(([tt]) => T >= tt); if (u) win.pill.textContent = '🔒 ' + u[1]; };
  });
  add(S(root, tHalf - 0.05, tC2 - 0.05, { enter: 'zoom' }, (n) => {
    const a = txt(n, 'But finding them is only *half* of it.', { y: 450, size: 92, stagger: 0.05 });
    return (t) => a.update(t);
  }));

  // ───────────── 13. CHANGE 02: AI writes ─────────────
  const tStare = at('you never stare'), tAIw = at('The AI writes'), tLike = at('And it sounds like you'), tRobot = at('not like a robot'), tRead = at('You read it'), tAppr = at('you approve it'), tNothing = at('Nothing goes out'), tWatch = at('Now watch what happens'), tC3 = at('Change number three');
  titleCard(tC2 - 0.05, tAIw - 0.05, '02', 'You never stare at a *blank* *message* again.', { lineAt: tStare });
  const FO = CLIPS.follow;
  winScene(tAIw - 0.05, tWatch - 0.05, {
    clip: 'follow', url: 'getspurly.com/hub/campaigns/heads-of-growth',
    map: [[tAIw - 0.05, FO.m('edit', -0.4)], [tLike - 0.3, FO.m('written', 0.2)], [tRead, FO.m('written', 1.6)], [tAppr + 0.4, FO.m('review', -0.1)], [tWatch, FO.m('review', 1.5)]],
    heads: [[tAIw, '*AI* writes every note & message.'], [tLike, 'It sounds like _you._'], [tRobot, 'Not like a ~robot.~'], [tRead, 'You *read* it. You *approve* it.'], [tNothing, 'Nothing goes out *unseen.*']],
    cues: [[tAIw + 0.3, 'type', 0.5], [tAppr, 'confirm', 0.8], [tNothing, 'pop', 0.5]],
  });
  add(S(root, tWatch - 0.05, tC3 - 0.05, { enter: 'zoom' }, (n) => {
    const a = txt(n, 'Now watch what happens\nafter you hit *approve.*', { y: 380, size: 96, stagger: 0.05 });
    cue(tWatch + 0.6, 'riser', 0.6);
    return (t) => a.update(t);
  }));

  // ───────────── 14. CHANGE 03: never chase ─────────────
  const tBig = at('and this is the big one'), tChase = at('You never chase'), tVis = at('Spurly visits their profile'), tFo = at('follows them'), tLk = at('likes their latest post'), tReq = at('sends the request'), tWait = at('waits for them to accept'),
    tMsg = at('then messages'), tFU = at('and follows up'), tSec = at('And the second they reply'), tStop = at('it stops'), tAwk = at('No awkward'), tThat = at('And that\'s it'), tLive = at('campaign live'), tCloud = at('It runs in the cloud'),
    tLid = at('Laptop closed'), tSleep = at('you asleep'), tStill = at('still working'), tAcc = at('It even accepts'), tWd = at('quietly withdraws'), tNowI = at('Now, I know');
  titleCard(tC3 - 0.05, tVis - 0.05, '03', 'You never *chase* anyone again.', { lineAt: tChase });
  cue(tBig, 'impact_soft', 0.8);
  add(S(root, tVis - 0.05, tThat - 0.05, { enter: 'whip' }, (n) => {
    const hd = head(n, [[tVis, 'Your *sequence*, on autopilot.'], [tSec, 'The second they *reply…*'], [tStop, 'It *stops.*'], [tAwk, 'No awkward “just bumping this”.']]);
    const steps = [[tVis, 'eye', 'Visit profile'], [tFo, 'plus', 'Follow'], [tLk, 'heart', 'Like latest post'], [tReq, 'user', 'Connection request'], [tWait, 'clock', 'Wait until accepted'], [tMsg, 'chat', 'Message'], [tFU, 'loop', 'Follow up']];
    const wrap = el('div', '', n); css(wrap, { position: 'absolute', left: '170px', top: '200px', width: '1580px', height: '620px' });
    const line = el('div', '', wrap); css(line, { position: 'absolute', left: '90px', top: '113px', height: '6px', width: '0px', borderRadius: '3px', background: 'linear-gradient(90deg,#7c93ff,#a78bfa)' });
    const nodes = steps.map(([t, ic, s], i) => {
      const nd = el('div', '', wrap); css(nd, { position: 'absolute', left: (i * 230) + 'px', top: '40px', width: '180px', textAlign: 'center' });
      const c = el('div', '', nd); css(c, { width: '150px', height: '150px', margin: '0 auto', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4c6ef5,#7966ff)', boxShadow: '0 20px 50px rgba(76,110,245,.45)' });
      icon(ic, 70, '#fff', c);
      const lb = el('div', '', nd, s); css(lb, { marginTop: '22px', font: '700 28px/1.2 IS' });
      cue(t, 'pop', 0.65);
      return { nd, c, t, i };
    });
    // reply bubble + stop
    const bub = el('div', 'card light', wrap, '<div style="display:flex;gap:16px;align-items:center"><div class="av" style="width:58px;height:58px;font-size:22px;background:linear-gradient(135deg,#fbbf24,#f97316)">HC</div><div><div style="font:700 26px IS;color:#0b1030">Harriet Cole replied</div><div style="font:500 24px IS;color:#565d86;margin-top:4px">“Sure, Thursday works. Send a link?”</div></div></div>');
    css(bub, { left: '300px', top: '330px', width: '720px', padding: '26px 30px' });
    const stop = el('div', '', wrap, '<span>STOPPED</span><small>handed to you</small>');
    css(stop, { position: 'absolute', left: '1080px', top: '320px', padding: '22px 40px', borderRadius: '22px', border: '5px solid #ff5d6c', color: '#ff7a86', font: '700 58px IS', letterSpacing: '.08em', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,93,108,.08)' });
    stop.querySelector('small').style.cssText = 'font:600 22px MONO;letter-spacing:.15em;color:#ffb3ba;margin-top:4px';
    const draft = el('div', 'card', wrap, '<div style="font:600 26px IS;color:#c9cdea">Draft follow-up:</div><div style="font:500 30px IS;margin-top:8px">“Just bumping this to the top of your inbox…”</div>');
    css(draft, { left: '420px', top: '480px', width: '760px', padding: '24px 30px' });
    const xx = el('div', '', draft, ICON.x); css(xx, { position: 'absolute', right: '-30px', top: '-30px', width: '110px', height: '110px', color: '#ff5d6c', filter: 'drop-shadow(0 0 20px rgba(255,93,108,.6))' }); xx.firstChild.style.cssText = 'width:100%;height:100%';
    cue(tSec + 0.2, 'notif', 0.8); cue(tStop, 'stamp', 1.0); cue(tAwk + 0.5, 'error', 0.6);
    return (t, T) => {
      hd(T);
      nodes.forEach(({ nd, c, t: nt, i }) => {
        const e = ease.back(pr(T, nt - 0.08, 0.45));
        nd.style.opacity = clamp(e * 3); nd.style.transform = `translateY(${(1 - e) * 60}px) scale(${0.7 + 0.3 * e})`;
        const done = T > tStop ? (i >= 5 ? 1 : 0) : 0;
        c.style.filter = done ? 'grayscale(1) brightness(.6)' : '';
      });
      const last = [...nodes].reverse().find((x) => T >= x.t); line.style.width = last ? (last.i * 230) + 'px' : '0px';
      const lift = ease.inout(pr(T, tSec - 0.3, 0.5)); wrap.style.transform = `translateY(${-110 * lift}px)`;
      const bb = ease.back(pr(T, tSec + 0.1, 0.45)); bub.style.opacity = clamp(bb * 3); bub.style.transform = `translateY(${(1 - bb) * 60}px)`;
      const st = ease.out5(pr(T, tStop - 0.03, 0.25)); stop.style.opacity = clamp(st * 3); stop.style.transform = `scale(${2 - st}) rotate(${-8 * st}deg)`;
      const dr = ease.back(pr(T, tAwk, 0.4)); draft.style.opacity = clamp(dr * 3) * (T > tAwk + 1.6 ? 1 - ease.in(pr(T, tAwk + 1.6, 0.3)) : 1); draft.style.transform = `translateY(${(1 - dr) * 50}px)`;
      const xe = ease.out5(pr(T, tAwk + 0.5, 0.25)); xx.style.opacity = clamp(xe * 3); xx.style.transform = `scale(${2 - xe})`;
      const [sx, sy] = shake(T, tStop, 14, 0.3); n.style.translate = `${sx}px ${sy}px`;
    };
  }));
  winScene(tThat - 0.05, tCloud - 0.05, {
    clip: 'follow', url: 'getspurly.com/hub/campaigns/heads-of-growth', sopts: { enter: 'zoom' },
    map: [[tThat - 0.05, FO.m('review', 0.9)], [tCloud, FO.m('sending', 0.6)]],
    heads: [[tThat, 'And that\'s it.'], [tLive, 'Campaign *live.*']],
    cues: [[tLive - 0.1, 'click', 0.8], [tLive, 'confirm', 0.8]],
  }, (n) => {
    const live = el('div', '', n, '<i></i>LIVE'); css(live, { position: 'absolute', right: '330px', top: '170px', padding: '10px 22px', borderRadius: '999px', background: '#ff3b55', font: '700 28px IS', letterSpacing: '.12em', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 40px rgba(255,59,85,.6)' });
    css(live.querySelector('i'), { width: '14px', height: '14px', borderRadius: '50%', background: '#fff', display: 'block' });
    return (t, T) => { const e = ease.back(pr(T, tLive, 0.4)); live.style.opacity = clamp(e * 3); live.style.transform = `scale(${0.5 + 0.5 * e})`; live.querySelector('i').style.opacity = 0.4 + 0.6 * Math.abs(Math.sin(T * 4)); };
  });
  // 24/7: laptop closes, night falls, it keeps working
  pal(tCloud - 0.05, { ...P.deep, dur: 1.2 }); mus(tCloud - 0.05, 'soft');
  FX.amb.push({ t0: tLid, t1: tAcc, kind: 'crickets', gain: 1 });
  add(S(root, tCloud - 0.05, tAcc - 0.05, { enter: 'up' }, (n) => {
    const hd = head(n, [[tCloud, 'Runs in the *cloud.* *24/7.*'], [tLid, 'Laptop _closed._'], [tSleep, 'You, _asleep._'], [tStill, 'Spurly? *Still* *working.*']], { size: 72, y: 70 });
    const lap = el('div', '', n); css(lap, { position: 'absolute', left: '660px', top: '330px', width: '600px', height: '420px' });
    const lid = el('div', '', lap); css(lid, { position: 'absolute', left: '40px', bottom: '40px', width: '520px', height: '330px', borderRadius: '18px 18px 6px 6px', background: 'linear-gradient(160deg,#2b3270,#151a44)', border: '3px solid #3a4290', transformOrigin: '50% 100%', overflow: 'hidden' });
    const scr = el('div', '', lid); css(scr, { position: 'absolute', inset: '14px', borderRadius: '10px', background: 'linear-gradient(135deg,#eef1ff,#dfe4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const smk = el('img', '', scr); smk.src = 'mark.png'; css(smk, { height: '120px' });
    const base = el('div', '', lap); css(base, { position: 'absolute', left: 0, bottom: '14px', width: '600px', height: '30px', borderRadius: '6px 6px 22px 22px', background: 'linear-gradient(#3a4290,#232a66)' });
    const moon = el('div', '', n); css(moon, { position: 'absolute', left: '1460px', top: '200px', width: '130px', height: '130px', color: '#ffe6a6', filter: 'drop-shadow(0 0 40px rgba(255,220,140,.6))' }); moon.innerHTML = ICON.moon; moon.firstChild.style.cssText = 'width:100%;height:100%';
    const stars = Array.from({ length: 40 }, (_, i) => { const s = el('div', '', n); const r = Math.sin(i * 91.7) * 0.5 + 0.5, q = Math.cos(i * 37.3) * 0.5 + 0.5; css(s, { position: 'absolute', left: (80 + r * 1760) + 'px', top: (150 + q * 380) + 'px', width: '4px', height: '4px', borderRadius: '50%', background: '#fff' }); return s; });
    const feed = el('div', '', n); css(feed, { position: 'absolute', left: '150px', top: '340px', width: '440px' });
    const items = ['Follow-up sent · Sofia M.', 'Profile visited · Ruben C.', 'Connection request · Ana K.', 'Message sent · Lukas B.', 'Post liked · Ida N.', 'Follow-up sent · Noah B.'].map((s, i) => {
      const it = el('div', 'card', feed, `<span style="color:#7cf0b4;margin-right:10px">●</span>${s}`); css(it, { position: 'relative', marginBottom: '14px', padding: '16px 22px', font: '600 24px IS', borderRadius: '16px' });
      return it;
    });
    const clk = el('div', 'mono', n); css(clk, { position: 'absolute', left: '1370px', top: '470px', fontSize: '74px', color: '#e8ebff' });
    cue(tLid, 'stamp', 0.4); cue(tStill, 'notif', 0.6);
    return (t, T) => {
      hd(T);
      const close = ease.inout(pr(T, tLid - 0.1, 0.7));
      lid.style.transform = `perspective(900px) rotateX(${close * 86}deg)`;
      const night = ease.inout(pr(T, tLid, 1.2));
      moon.style.opacity = night; stars.forEach((s, i) => (s.style.opacity = night * (0.3 + 0.7 * Math.abs(Math.sin(T * 1.7 + i)))));
      const hr = 23 + Math.floor((T - tCloud) * 0.9); const mm = Math.floor(((T - tCloud) * 57) % 60);
      clk.textContent = `${String(hr % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      clk.style.opacity = clamp((T - tLid) * 3);
      items.forEach((it, i) => { const e = ease.back(pr(T, tSleep - 0.3 + i * 0.32, 0.4)); it.style.opacity = clamp(e * 3); it.style.transform = `translateX(${(1 - e) * -60}px)`; if (e > 0 && e < 0.2 && !it.dataset.c) it.dataset.c = 1; });
    };
  }));
  ['Follow-up', 'Visit', 'Request', 'Message', 'Like', 'Follow-up'].forEach((_, i) => cue(tSleep - 0.3 + i * 0.32, 'tick_ui', 0.35));
  const IV = CLIPS.invitations;
  pal(tAcc - 0.05, { ...P.brand, dur: 0.5 }); mus(tAcc - 0.05, 'drive');
  winScene(tAcc - 0.05, tNowI - 0.05, {
    clip: 'invitations', url: 'getspurly.com/hub/invitations',
    map: [[tAcc - 0.05, IV.m('received', 0.1)], [tAcc + 1.4, IV.m('accepted', 0.4)], [tAcc + 1.4, IV.m('typed', 0.1)], [tWd - 0.1, IV.m('saved', 0.8)], [tWd - 0.1, IV.m('start', 0.5)], [tNowI, IV.m('withdrawn', 0.8)]],
    heads: [[tAcc, 'Accepts the *right* requests.'], [tWd, 'Quietly withdraws the *old* ones.']],
    cues: [[tAcc + 1.0, 'confirm', 0.7], [tWd + 0.6, 'close', 0.6]],
  });

  // ───────────── 15. Objection ─────────────
  const tIs = at('Is this going to get'), tFair = at('Fair question'), tPaces = at('Spurly paces everything'), tGaps = at('random gaps'), tLim = at('daily limits'), tQuiet = at('quiet hours you choose'),
    tNoTool = at('No tool on earth'), tCareful = at('but Spurly is built'), tFree = at('And it works with a free'), tPrem = at('Premium'), tNav = at('No SalesNavigator'), tC4 = at('Change number four');
  pal(tNowI - 0.05, { ...P.deep, dur: 0.4 }); mus(tNowI - 0.08, 'suspense');
  FX.voice.push({ t0: tIs - 0.05, t1: findAfter('trouble?', tIs).e + 0.1, kind: 'thought' });
  add(S(root, tNowI - 0.05, tPaces - 0.05, { enter: 'zoom' }, (n) => {
    const a = txt(n, 'I know what you\'re _thinking…_', { y: 150, size: 70, stagger: 0.05, color: '#c3c9f5' });
    const bub = el('div', '', n); css(bub, { position: 'absolute', left: '260px', top: '330px', width: '1400px', padding: '50px 70px', borderRadius: '48px', background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.18)', font: '700 76px/1.15 IS', letterSpacing: '-.02em', textAlign: 'center' });
    const q = '“Is this going to get my LinkedIn account in trouble?”';
    const tail = el('div', '', n); css(tail, { position: 'absolute', left: '400px', top: '600px', width: '60px', height: '60px', transform: 'rotate(45deg)', background: 'rgba(255,255,255,.06)', borderRight: '2px solid rgba(255,255,255,.18)', borderBottom: '2px solid rgba(255,255,255,.18)' });
    const fair = txt(n, 'Fair _question._', { y: 760, size: 84, stagger: 0.06, color: '#8ea2ff' });
    cue(tIs, 'type', 0.45); cue(tFair, 'pop', 0.5);
    const qEnd = findAfter('trouble?', tIs).e;
    return (t, T) => {
      a.update(t);
      const k = Math.round(clamp((T - tIs) / (qEnd - tIs)) * q.length);
      bub.innerHTML = q.slice(0, k) + (k < q.length && T > tIs ? '<span style="color:#8ea2ff">|</span>' : '');
      const e = ease.out5(pr(T, tIs - 0.2, 0.4)); bub.style.opacity = e; tail.style.opacity = e; bub.style.transform = `scale(${0.92 + 0.08 * e})`;
      fair.update(T - tFair);
    };
  }));
  add(S(root, tPaces - 0.05, tFree - 0.05, { enter: 'whip' }, (n) => {
    const hd = head(n, [[tPaces, 'Paced like a *real* *person.*'], [tNoTool, 'No tool can promise *zero* risk.'], [tCareful, 'Spurly is *careful* by default.']], { size: 70, y: 70 });
    const mk = (x, t, title, sub) => { const c = el('div', 'card', n); css(c, { left: x + 'px', top: '260px', width: '500px', height: '440px', padding: '40px' }); el('div', '', c, `<div style="font:700 44px IS;letter-spacing:-.02em">${title}</div><div style="font:500 26px IS;color:#a9b0d6;margin-top:10px">${sub}</div>`); return { c, t }; };
    const c1 = mk(170, tGaps, 'Random gaps', 'between every action');
    const dots = Array.from({ length: 9 }, (_, i) => { const d = el('div', '', c1.c); const x = [0, 34, 96, 121, 190, 236, 300, 355, 392][i]; css(d, { position: 'absolute', left: (40 + x) + 'px', top: '300px', width: '20px', height: '20px', borderRadius: '50%', background: '#7c93ff' }); return d; });
    const tl = el('div', '', c1.c); css(tl, { position: 'absolute', left: '40px', right: '40px', top: '309px', height: '2px', background: 'rgba(255,255,255,.18)' });
    const c2 = mk(710, tLim, 'Daily limits', 'that stay human');
    const g = el('div', '', c2.c); css(g, { position: 'absolute', left: '90px', top: '200px', width: '320px', height: '160px', overflow: 'hidden' });
    const arcBg = el('div', '', g); css(arcBg, { position: 'absolute', left: 0, top: 0, width: '320px', height: '320px', borderRadius: '50%', border: '26px solid rgba(255,255,255,.1)', boxSizing: 'border-box' });
    const arc = el('div', '', g); css(arc, { position: 'absolute', left: 0, top: 0, width: '320px', height: '320px', borderRadius: '50%', border: '26px solid transparent', borderTopColor: '#34d399', borderLeftColor: '#34d399', boxSizing: 'border-box', transform: 'rotate(-45deg)' });
    const c3 = mk(1250, tQuiet, 'Quiet hours', 'you choose');
    const qh = el('div', '', c3.c, `<div style="display:flex;align-items:center;gap:18px;margin-top:70px"><div style="width:80px;height:80px;color:#ffe6a6">${ICON.moon}</div><div style="font:700 64px MONO">22:00</div></div><div style="font:600 30px MONO;color:#a9b0d6;margin:8px 0 0 98px">→ 07:00</div>`);
    qh.querySelector('svg').style.cssText = 'width:100%;height:100%';
    const shield = el('div', '', n, ICON.shield); css(shield, { position: 'absolute', left: '50%', top: '740px', width: '120px', height: '120px', marginLeft: '-60px', color: '#34d399', filter: 'drop-shadow(0 0 30px rgba(52,211,153,.55))' }); shield.firstChild.style.cssText = 'width:100%;height:100%';
    [c1, c2, c3].forEach((c) => cue(c.t, 'pop', 0.6)); cue(tCareful, 'confirm', 0.7);
    return (t, T) => {
      hd(T);
      [c1, c2, c3].forEach(({ c, t: ct }) => { const e = ease.back(pr(T, ct - 0.1, 0.45)); const dim = ease.inout(pr(T, tNoTool - 0.1, 0.4)) * (1 - ease.inout(pr(T, tCareful, 0.4))); css(c, { opacity: clamp(e * 3) * (1 - 0.5 * dim), transform: `translateY(${(1 - e) * 60}px)` }); });
      dots.forEach((d, i) => { const e = ease.back(pr(T, tGaps + 0.1 + [0, .1, .32, .4, .62, .76, .97, 1.14, 1.26][i] * 0.9, 0.25)); d.style.transform = `scale(${e})`; });
      arc.style.transform = `rotate(${-45 + 110 * ease.out(pr(T, tLim + 0.1, 0.9))}deg)`;
      const s = ease.back(pr(T, tCareful, 0.5)); shield.style.opacity = clamp(s * 3); shield.style.transform = `scale(${0.5 + 0.5 * s})`;
    };
  }));
  add(S(root, tFree - 0.05, tC4 - 0.05, { enter: 'up' }, (n) => {
    const a = txt(n, 'Works with the LinkedIn you *already* *have.*', { y: 170, size: 74, stagger: 0.05 });
    const row = el('div', '', n); css(row, { position: 'absolute', left: '50%', top: '420px', transform: 'translateX(-50%)', display: 'flex', gap: '30px' });
    const pill = (s, ok) => { const p = el('div', '', row, `<span style="width:54px;height:54px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:${ok ? '#34d399' : '#ff5d6c'};color:#06281b">${ok ? ICON.check : ICON.x}</span>${s}`); css(p, { display: 'flex', alignItems: 'center', gap: '20px', padding: '26px 40px', borderRadius: '999px', font: '700 44px IS', background: 'rgba(255,255,255,.07)', border: '2px solid rgba(255,255,255,.18)' }); p.querySelector('svg').style.cssText = 'width:30px;height:30px;color:#fff'; return p; };
    const p1 = pill('Free LinkedIn', true), p2 = pill('Premium', true), p3 = pill('<span style="text-decoration:line-through;text-decoration-color:#ff5d6c;text-decoration-thickness:5px">Sales Navigator</span>&nbsp;<span style="font:600 30px IS;color:#ffb3ba">not needed</span>', false);
    p3.style.marginTop = '0';
    const wrap2 = el('div', '', n); css(wrap2, { position: 'absolute', left: '50%', top: '600px', transform: 'translateX(-50%)' }); wrap2.appendChild(p3);
    cue(tFree + 0.6, 'confirm', 0.6); cue(tPrem, 'confirm', 0.6); cue(tNav, 'stamp', 0.6);
    return (t, T) => {
      a.update(t);
      [[p1, tFree + 0.6], [p2, tPrem], [p3, tNav]].forEach(([p, pt]) => { const e = ease.back(pr(T, pt - 0.05, 0.4)); p.style.opacity = clamp(e * 3); p.style.transform = `scale(${0.6 + 0.4 * e})`; });
    };
  }));

  // ───────────── 16. CHANGE 04: inbox, enrichment, analytics ─────────────
  const tLose = at('you never lose'), tLands = at('Every reply lands'), tEmail = at('Need their email'), tWatch2 = at('One click and you can watch'), tInv = at('Invites'), tAccd = at('accepted'), tRep = at('replies'), tFast = at('even how fast'), tOk = at('Okay'), tC5 = at('change number five'), tProm = at('the one I promised'), tPlug = at('Spurly plugs straight into Claude');
  pal(tC4 - 0.05, { ...P.brand, dur: 0.4 }); mus(tC4 - 0.05, 'drive');
  titleCard(tC4 - 0.05, tLands - 0.05, '04', 'You never *lose* a conversation again.', { lineAt: tLose });
  const IB = CLIPS.inbox;
  winScene(tLands - 0.05, tEmail - 0.05, {
    clip: 'inbox', url: 'getspurly.com/hub/inbox',
    map: [[tLands - 0.05, IB.m('inbox', 0.4)], [tEmail, IB.m('typed', -0.2)]],
    heads: [[tLands, 'Every reply. *One* *inbox.*']], cues: [[tLands + 0.6, 'click', 0.6]],
  });
  add(S(root, tEmail - 0.05, tWatch2 + 0.55, { enter: 'zoom' }, (n) => {
    const hd = head(n, [[tEmail, 'Need their *email* or *phone?*'], [tWatch2, '*One* *click.*']], { y: 120, size: 76 });
    const c = el('div', 'card light', n); css(c, { left: '560px', top: '330px', width: '800px', height: '440px', padding: '44px 50px' });
    el('div', '', c, '<div style="display:flex;gap:24px;align-items:center"><div class="av" style="width:96px;height:96px;font-size:36px;background:linear-gradient(135deg,#34d399,#059669)">CW</div><div><div style="font:700 42px IS;color:#0b1030">Clara Weiss</div><div style="font:500 26px IS;color:#565d86">Head of Marketing, Quillon</div></div></div>');
    const btn = el('div', '', c, '<span style="display:inline-block;width:28px;height:28px;vertical-align:-5px;margin-right:10px">' + ICON.spark + '</span>Find email &amp; phone');
    css(btn, { marginTop: '40px', display: 'inline-block', padding: '18px 34px', borderRadius: '16px', font: '700 30px IS', color: '#fff', background: 'linear-gradient(135deg,#4c6ef5,#7966ff)', boxShadow: '0 12px 30px rgba(76,110,245,.4)' });
    btn.querySelector('svg').style.cssText = 'width:100%;height:100%';
    const res = el('div', '', c); css(res, { marginTop: '34px', display: 'flex', flexDirection: 'column', gap: '16px' });
    const r1 = el('div', '', res, `<span style="width:34px;height:34px;color:#3b5bdb">${ICON.mail}</span><span>clara.weiss@quillon.com</span>`);
    const r2 = el('div', '', res, `<span style="width:34px;height:34px;color:#3b5bdb">${ICON.phone}</span><span>+49 151 •••• 2210</span>`);
    [r1, r2].forEach((r) => { css(r, { display: 'flex', alignItems: 'center', gap: '16px', font: '600 34px MONO', color: '#0b1030' }); r.querySelector('svg').style.cssText = 'width:34px;height:34px'; });
    const tc = tWatch2 - 0.05;
    cue(tc, 'click', 0.9); cue(tc + 0.25, 'shimmer', 0.5); cue(tc + 0.3, 'confirm', 0.6);
    return (t, T) => {
      hd(T);
      const e = ease.back(pr(t, 0.05, 0.45)); c.style.transform = `translateY(${(1 - e) * 60}px)`; c.style.opacity = clamp(e * 3);
      const pz = T > tc && T < tc + 0.15 ? 0.93 : 1; btn.style.transform = `scale(${pz})`;
      [r1, r2].forEach((r, i) => { const u = ease.out5(pr(T, tc + 0.25 + i * 0.15, 0.35)); r.style.opacity = u; r.style.transform = `translateX(${(1 - u) * -30}px)`; });
    };
  }));
  winScene(tWatch2 + 0.55, tOk - 0.05, {
    clip: 'inbox', url: 'getspurly.com/hub/dashboard', sopts: { enter: 'zoom' },
    map: [[tWatch2 + 0.55, IB.m('dash', 0.9)], [tFast - 0.1, IB.m('analytics', 0.4)], [tOk, IB.m('end')]],
    heads: [[tWatch2 + 0.55, 'Watch it *working.*'], [tInv, '*Invites.*'], [tAccd, '*Accepted.*'], [tRep, '*Replies.*'], [tFast, 'Even how *fast* they reply.']],
    cues: [[tInv, 'tick_ui', 0.6], [tAccd, 'tick_ui', 0.6], [tRep, 'tick_ui', 0.6], [tFast + 0.6, 'pop', 0.5]],
  });

  // ───────────── 17. CHANGE 05: the reveal ─────────────
  pal(tOk - 0.05, { ...P.deep, dur: 0.3 }); mus(tOk - 0.1, 'silence'); mus(tPlug - 0.02, 'epic');
  FX.voice.push({ t0: tProm - 0.08, t1: findAfter('promised.', tProm).e + 0.05, kind: 'whisper' });
  add(S(root, tOk - 0.05, tPlug - 0.04, { enter: 'cut' }, (n) => {
    const tile = el('div', '', n); css(tile, { position: 'absolute', left: '50%', top: '50%', width: '420px', height: '500px', margin: '-250px 0 0 -210px', borderRadius: '44px', border: '3px solid transparent',
      background: 'linear-gradient(#0b0e2c,#0b0e2c) padding-box, linear-gradient(120deg,#7966ff,#38bdf8,#f472b6,#7966ff) border-box', backgroundSize: '100% 100%, 300% 300%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' });
    const num = el('div', '', tile, '05'); css(num, { font: '700 200px/1 IS', letterSpacing: '-.05em', color: 'rgba(255,255,255,.3)' });
    const lk = icon('lock', 120, '#fff', tile); css(lk, { marginTop: '20px' });
    const promised = txt(n, '_the_ _one_ _I_ _promised…_', { y: 840, size: 64, stagger: 0.08, color: '#c3c9f5', style: 'fade' });
    cue(tC5 - 0.05, 'riser', 0.8); cue(tC5 + 0.4, 'lock_rattle', 0.7);
    return (t, T) => {
      tile.style.backgroundPosition = `0 0, ${(T * 60) % 300}% 50%`;
      const z = ease.inout(pr(T, tC5, tPlug - tC5)); tile.style.transform = `scale(${0.9 + 0.35 * z})`;
      const sh = T > tC5 + 0.4 ? Math.sin(T * 70) * 8 * clamp(1 - (T - tC5 - 0.4) / 0.7) : 0; lk.style.transform = `rotate(${sh}deg)`;
      tile.style.boxShadow = `0 0 ${120 * z}px rgba(121,102,255,${0.7 * z})`;
      promised.update(T - tProm);
    };
  }));
  const tGPT = at('ChatGPT'), tType = at('So you can literally type'), tFindMe = at('find me 50'), tWho = at('Or who replied today'), tDraft = at('Draft my answers'), tJust = at('And it just'), tDoesIt = at('does it'), tIKnow = at('I know'), tYour = at('Your AI SDR'), tLiving = at('living inside'), tBloat = at('No bloated');
  const CL = CLIPS.claude;
  add(S(root, tPlug - 0.04, tType - 0.05, { enter: 'zoom', flash: (lt) => (lt < 0.3 ? 0.3 * (1 - lt / 0.3) : 0) }, (n) => {
    const a = txt(n, '05 · You just *ask.*', { y: 180, size: 110, stagger: 0.06 });
    const row = el('div', '', n); css(row, { position: 'absolute', left: '50%', top: '520px', transform: 'translateX(-50%)', display: 'flex', gap: '30px' });
    const chips = [['Claude', '#d97757'], ['ChatGPT', '#10a37f'], ['Cursor', '#e8e8ef']].map(([s, c], i) => { const p = el('div', '', row, `<span style="width:22px;height:22px;border-radius:50%;background:${c};display:inline-block;margin-right:16px;box-shadow:0 0 18px ${c}"></span>${s}`); css(p, { padding: '28px 48px', borderRadius: '999px', font: '700 54px IS', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center' }); return p; });
    const plus = el('div', 'mono', n, 'SPURLY · MCP CONNECTOR'); css(plus, { position: 'absolute', left: 0, right: 0, top: '740px', textAlign: 'center', fontSize: '26px', letterSpacing: '.3em', color: '#9fb0ff' });
    cue(tPlug - 0.04, 'logo_hit', 1.0); cue(tPlug + 0.6, 'pop', 0.6); cue(tGPT, 'pop', 0.6); cue(tGPT + 0.45, 'pop', 0.6);
    return (t, T) => {
      a.update(t);
      [tPlug + 0.6, tGPT, tGPT + 0.45].forEach((ct, i) => { const e = ease.back(pr(T, ct - 0.05, 0.4)); chips[i].style.opacity = clamp(e * 3); chips[i].style.transform = `translateY(${(1 - e) * 50}px) scale(${0.7 + 0.3 * e})`; });
      plus.style.opacity = clamp((T - tGPT - 0.5) * 3);
    };
  }));
  winScene(tType - 0.05, tIKnow - 0.05, {
    clip: 'claude', url: 'getspurly.com/hub', y: 150, sopts: { enter: 'whip' },
    map: [[tType - 0.05, CL.m('consent', -0.3)], [tWho - 0.1, CL.m('settings', -0.25)], [tWho - 0.1, CL.m('card', 0.5)], [tJust, CL.m('card', 2.1)], [tJust, CL.m('campaigns', 0.1)], [tIKnow, CL.m('end', -0.3)]],
    heads: [[tDoesIt, 'And it just… *does* *it.*', { size: 76 }]],
    cues: [[tFindMe, 'type', 0.5], [tWho + 0.1, 'type', 0.5], [tDoesIt, 'impact_soft', 0.9], [tDoesIt + 0.05, 'shimmer', 0.6]],
  }, (n) => {
    const pill = el('div', '', n); css(pill, { position: 'absolute', left: '50%', top: '40px', transform: 'translateX(-50%)', padding: '22px 40px', borderRadius: '999px', background: 'rgba(255,255,255,.96)', color: '#14183c', font: '600 38px IS', boxShadow: '0 20px 60px rgba(0,0,0,.4)', whiteSpace: 'nowrap', border: '2px solid #8ea2ff' });
    const asks = [[tFindMe, findAfter('campaign.', tFindMe).e, 'Find me 50 SaaS founders in London and put them in a campaign.'], [tWho, findAfter('answers.', tWho).e, 'Who replied today? Draft my answers.']];
    return (t, T) => {
      const a = [...asks].reverse().find(([s]) => T >= s - 0.3);
      if (!a || T > tJust - 0.05) { pill.style.opacity = 0; return; }
      const [s, e, q] = a; const k = Math.round(clamp((T - s) / (e - s)) * q.length);
      pill.innerHTML = `<span style="color:#d97757;margin-right:14px">✳</span>${q.slice(0, k)}<span style="color:#3b5bdb;opacity:${Math.sin(T * 12) > 0 ? 1 : 0}">|</span>`;
      pill.style.opacity = 1;
    };
  });
  add(S(root, tIKnow - 0.05, tBloat - 0.05, { enter: 'zoom' }, (n) => {
    const k1 = txt(n, '_I_ _know._', { y: 200, size: 84, stagger: 0.08, color: '#c3c9f5' });
    const k2 = txt(n, 'Your *AI* *SDR*,\nliving inside the AI\nyou already use.', { y: 360, size: 104, stagger: 0.05 });
    return (t, T) => { k1.update(t); k2.update(T - tYour); };
  }));

  // ───────────── 18. No bloat ─────────────
  const tConf = at('no confusing plans'), tOneP = at('just one product'), tCost = at('So what does all of that cost');
  pal(tBloat - 0.05, { ...P.brand, dur: 0.4 }); mus(tBloat - 0.05, 'warm');
  add(S(root, tBloat - 0.05, tCost - 0.05, { enter: 'whip' }, (n) => {
    const a = txt(n, 'No ~bloated~ ~sales~ ~team.~', { y: 210, size: 96, stagger: 0.05 });
    const b = txt(n, 'No ~confusing~ ~plans.~', { y: 360, size: 96, stagger: 0.05 });
    const c = txt(n, 'One product that does\nthe work of an *SDR.*', { y: 560, size: 100, stagger: 0.05 });
    cue(tBloat + 0.6, 'scratch', 0.35); cue(tConf + 0.6, 'scratch', 0.35); cue(tOneP, 'impact_soft', 0.7);
    return (t, T) => { a.update(t); b.update(T - tConf); c.update(T - tOneP); const dim = ease.inout(pr(T, tOneP, 0.4)); a.node.style.opacity = b.node.style.opacity = 1 - 0.6 * dim; };
  }));

  // ───────────── 19. Price ─────────────
  const t80k = at('Not $80,000'), t150 = at('not $150'), tRight = at('Right now'), tLaunch = at('launch price'), tLunch = at('less than a lunch out'), tPer = at('per month'), tSeven = at('And your first seven days'), tNoCard = at('no card'), tHere = at('So here\'s the thing');
  mus(tCost - 0.05, 'groove');
  add(S(root, tCost - 0.05, tHere - 0.05, { enter: 'zoom' }, (n) => {
    const q = txt(n, 'So what does it *cost?*', { y: 80, size: 88, stagger: 0.05 });
    const card = (x, t, big, sub) => { const c = el('div', 'card', n); css(c, { left: x + 'px', top: '260px', width: '520px', height: '300px', padding: '44px', textAlign: 'center' }); el('div', '', c, `<div style="font:700 92px IS;letter-spacing:-.04em">${big}</div><div style="font:500 30px IS;color:#a9b0d6;margin-top:8px">${sub}</div>`); const x2 = el('div', '', c); css(x2, { position: 'absolute', left: '30px', right: '30px', top: '108px', height: '10px', borderRadius: '5px', background: '#ff5d6c', boxShadow: '0 0 24px rgba(255,93,108,.7)', transformOrigin: '0 50%' }); return { c, x2, t }; };
    const A = card(380, t80k, '$80,000', 'a year for an SDR'), B = card(1020, t150, '$150', 'a seat, other tools');
    const deal = el('div', '', n); css(deal, { position: 'absolute', left: '50%', top: '610px', transform: 'translateX(-50%)', padding: '36px 60px', borderRadius: '36px', textAlign: 'center', background: 'linear-gradient(135deg,rgba(76,110,245,.3),rgba(121,102,255,.3))', border: '2px solid rgba(142,162,255,.7)', boxShadow: '0 0 80px rgba(121,102,255,.45)', whiteSpace: 'nowrap' });
    const l1 = el('div', 'mono', deal, 'LAUNCH PRICE'); css(l1, { fontSize: '26px', letterSpacing: '.3em', color: '#c3ccff' });
    const l2 = el('div', '', deal, `<span style="display:inline-block;width:62px;height:62px;vertical-align:-10px;margin-right:16px;color:#ffd08a">${ICON.fork}</span>Less than a lunch out <span style="font:500 40px IS;color:#c3c9f5">/ month</span>`);
    css(l2, { font: '700 70px IS', letterSpacing: '-.03em', marginTop: '6px' }); l2.querySelector('svg').style.cssText = 'width:100%;height:100%';
    const free = el('div', '', n, '7 days free  ·  No card'); css(free, { position: 'absolute', left: '50%', top: '880px', transform: 'translateX(-50%)', padding: '14px 34px', borderRadius: '999px', background: 'rgba(52,211,153,.14)', border: '2px solid rgba(52,211,153,.6)', color: '#7cf0b4', font: '700 40px IS', whiteSpace: 'nowrap' });
    cue(t80k + 0.15, 'cash', 0.6); cue(t80k + 0.7, 'scratch', 0.45); cue(t150 + 0.6, 'scratch', 0.45); cue(tLaunch, 'impact_soft', 0.8); cue(tLaunch + 0.05, 'shimmer', 0.6); cue(tSeven, 'confirm', 0.7);
    return (t, T) => {
      q.update(t);
      [A, B].forEach(({ c, x2, t: ct }) => { const e = ease.back(pr(T, ct - 0.05, 0.4)); c.style.opacity = clamp(e * 3) * (1 - 0.5 * ease.inout(pr(T, tLaunch, 0.4))); c.style.transform = `translateY(${(1 - e) * 50}px)`; x2.style.transform = `scaleX(${ease.out5(pr(T, ct + 0.6, 0.3))})`; });
      const d = ease.back(pr(T, tLaunch - 0.05, 0.5)); deal.style.opacity = clamp(d * 3); deal.style.transform = `translateX(-50%) scale(${0.7 + 0.3 * d})`;
      const f = ease.back(pr(T, tSeven, 0.4)); free.style.opacity = clamp(f * 3); free.style.transform = `translateX(-50%) scale(${0.6 + 0.4 * f})`;
    };
  }));

  // ───────────── 20. Two ways to start ─────────────
  const tTwoWays = at('two ways to start'), tOneB = at('One'), tSet = at('We\'ll set Spurly up'), tTwo = at('Two'), tNoCard2 = at('no card'), tConn = at('Connect your LinkedIn'), tTonight = at('let it run tonight'), tEither = at('Either way'), tDoNow = at('do it now'), tEvery = at('every day you wait'), tViews = at('someone views your profile'), tNever = at('and never hears from you'), tRem = at('Remember that 7');
  mus(tHere - 0.05, 'finale');
  add(S(root, tHere - 0.05, tEither - 0.05, { enter: 'whip' }, (n) => {
    const q = txt(n, '*Two* ways to start.', { y: 70, size: 90, stagger: 0.06 });
    const mk = (x, t, num, title, lines, primary) => {
      const c = el('div', 'card', n); css(c, { left: x + 'px', top: '230px', width: '700px', height: '600px', padding: '50px', borderRadius: '40px' });
      if (primary) css(c, { background: 'linear-gradient(160deg,rgba(76,110,245,.35),rgba(121,102,255,.22))', border: '2px solid rgba(142,162,255,.7)', boxShadow: '0 30px 90px rgba(76,110,245,.35)' });
      el('div', 'mono', c, num).style.cssText = 'font-size:28px;letter-spacing:.3em;color:#9fb0ff';
      el('div', '', c, title).style.cssText = 'font:700 64px/1.05 IS;letter-spacing:-.03em;margin-top:14px';
      const ls = lines.map(([lt, s]) => { const r = el('div', '', c, `<span style="width:40px;height:40px;border-radius:50%;background:#34d399;display:inline-flex;align-items:center;justify-content:center;flex:none">${ICON.check}</span>${s}`); css(r, { display: 'flex', alignItems: 'center', gap: '18px', font: '600 34px IS', marginTop: '28px' }); r.querySelector('svg').style.cssText = 'width:24px;height:24px;color:#06281b'; return { r, lt }; });
      const btn = el('div', '', c, primary ? 'Book a call' : 'Start free trial'); css(btn, { position: 'absolute', left: '50px', right: '50px', bottom: '46px', padding: '26px', borderRadius: '999px', textAlign: 'center', font: '700 40px IS', background: primary ? 'linear-gradient(135deg,#4c6ef5,#7966ff)' : 'rgba(255,255,255,.1)', border: primary ? 'none' : '2px solid rgba(255,255,255,.3)', boxShadow: primary ? '0 16px 40px rgba(76,110,245,.5)' : '' });
      return { c, t, ls, btn };
    };
    const A = mk(220, tOneB, '01', '15-minute call', [[tSet, 'Set up for your ICP, live'], [tSet + 1.6, 'See who\'s warm for you']], true);
    const B = mk(1000, tTwo, '02', 'Free trial', [[tNoCard2, '7 days, no card'], [tConn, 'Connect your LinkedIn'], [tTonight, 'Let it run tonight']], false);
    [A, B].forEach((x) => { cue(x.t, 'whoosh', 0.4); cue(x.t + 0.1, 'pop', 0.6); x.ls.forEach(({ lt }) => cue(lt, 'tick_ui', 0.5)); });
    return (t, T) => {
      q.update(t);
      [A, B].forEach(({ c, t: ct, ls }) => {
        const e = ease.back(pr(T, ct - 0.1, 0.5)); c.style.opacity = clamp(e * 3); c.style.transform = `translateY(${(1 - e) * 80}px)`;
        ls.forEach(({ r, lt }) => { const u = ease.out5(pr(T, lt - 0.05, 0.35)); r.style.opacity = u; r.style.transform = `translateX(${(1 - u) * -30}px)`; });
      });
      A.btn.style.transform = `scale(${1 + 0.02 * Math.sin(T * 5)})`;
    };
  }));

  // ───────────── 21. Do it now ─────────────
  add(S(root, tEither - 0.05, tRem - 0.05, { enter: 'zoom' }, (n) => {
    const a = txt(n, 'Do it *now,*\nwhile this page is open.', { y: 120, size: 96, stagger: 0.05 });
    const card = el('div', 'notif', n, '<div class="ic"></div><div><b>Clara Weiss viewed your profile</b><span>Head of Marketing, Quillon</span></div><i>now</i>');
    css(card, { left: '560px', right: 'auto', top: '540px', width: '800px', transformOrigin: '50% 50%' });
    const lab = el('div', 'mono', n, 'NO REPLY · DAY 1'); css(lab, { position: 'absolute', left: 0, right: 0, top: '700px', textAlign: 'center', fontSize: '30px', letterSpacing: '.2em', color: '#ff8a95' });
    cue(tViews, 'notif', 0.7); cue(tNever, 'boom_soft', 0.6);
    return (t, T) => {
      a.update(t);
      const e = ease.spring(pr(T, tViews - 0.1, 0.6)); card.style.opacity = clamp(e * 3); card.style.transform = `translateY(${(1 - e) * -80}px) scale(1.25)`;
      const g = ease.inout(pr(T, tNever, 1.0)); card.style.filter = `grayscale(${g}) brightness(${1 - 0.4 * g})`;
      const day = 1 + Math.floor(clamp(T - tNever - 0.3, 0, 9) * 3.2); lab.textContent = `NO REPLY · DAY ${day}`; lab.style.opacity = clamp((T - tNever) * 3);
    };
  }));

  // ───────────── 22. Close: back to 7 a.m. ─────────────
  const tNC = at('The new connections'), tTR = at('the replies'), tFUp = at('the follow-ups that just'), tTom = at('It can be tomorrow'), tClick = at('click the button below');
  const END = WORDS_END() + 3.2;
  pal(tRem - 0.05, { ...P.dawn, dur: 0.6 }); mus(tTom - 0.1, 'finale'); mus(END - 1.6, 'end');
  FX.amb.push({ t0: tRem, t1: tTom, kind: 'birds', gain: 0.8 });
  add(S(root, tRem - 0.05, tTom - 0.05, { enter: 'zoom' }, (n) => {
    const t1 = txt(n, 'Remember that\n*7* *a.m.* morning?', { x: 170, y: 330, a: 'left', size: 96, stagger: 0.06 });
    const ph = el('div', 'phone', n); css(ph, { left: '1180px', top: '100px' });
    el('div', 'isl', ph);
    const scr = el('div', 'scr', ph);
    const tm = el('div', '', scr, '7:00'); css(tm, { position: 'absolute', top: '96px', width: '100%', textAlign: 'center', font: '600 112px IS', letterSpacing: '-.03em' });
    const stack = el('div', '', scr); css(stack, { position: 'absolute', left: 0, right: 0, top: '262px' });
    const N = [[tNC, 'Connection accepted', 'Priya Raman accepted your invitation'], [tNC + 0.3, 'Connection accepted', 'Jonas Albrecht accepted your invitation'], [tTR, 'New reply · Harriet Cole', '“Sure, Thursday works. Send a link?”'], [tFUp, 'Follow-up sent · Sofia Marchetti', 'On schedule. Not one forgotten.']].map(([t, b, s]) => { const d = el('div', 'notif', stack, `<div class="ic"></div><div><b>${b}</b><span>${s}</span></div><i>now</i>`); cue(t, 'notif', 0.75); return { t, d }; });
    cue(tRem, 'dawn_swell', 0.6);
    return (t, T) => {
      t1.update(t);
      css(ph, { transform: `perspective(1600px) rotateY(-6deg) translateY(${Math.sin(T * 1.3) * 8}px) scale(1.03)` });
      let y = 0;
      for (let i = N.length - 1; i >= 0; i--) { const { t: nt, d } = N[i]; const u = pr(T, nt, 0.5); if (u <= 0) { d.style.opacity = 0; continue; } const e = ease.spring(u); css(d, { opacity: clamp(u * 4), transform: `translateY(${y + (1 - e) * -60}px)` }); y += 112 * clamp(u * 2.2); }
    };
  }));
  add(S(root, tTom - 0.05, END, { enter: 'zoom', flash: (lt) => (lt < 0.3 ? 0.4 * (1 - lt / 0.3) : 0) }, (n) => {
    const a = txt(n, 'It can be *tomorrow.*', { y: 150, size: 120, stagger: 0.07 });
    const lock = el('div', '', n); css(lock, { position: 'absolute', left: 0, right: 0, top: '380px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' });
    const mk = el('img', '', lock); mk.src = 'mark.png'; css(mk, { height: '110px' });
    el('div', '', lock, 'Spurly').style.cssText = 'font:700 110px IS;letter-spacing:-.045em';
    const sub = el('div', '', n, 'Your AI SDR for LinkedIn'); css(sub, { position: 'absolute', left: 0, right: 0, top: '530px', textAlign: 'center', font: '500 40px IS', color: '#c9d2ff' });
    const row = el('div', '', n); css(row, { position: 'absolute', left: '50%', top: '640px', transform: 'translateX(-50%)', display: 'flex', gap: '28px' });
    const b1 = el('div', '', row, 'Book a call'); css(b1, { padding: '30px 60px', borderRadius: '999px', font: '700 44px IS', background: 'linear-gradient(135deg,#4c6ef5,#7966ff)', boxShadow: '0 20px 60px rgba(92,108,255,.6)' });
    const b2 = el('div', '', row, 'Start free trial'); css(b2, { padding: '30px 60px', borderRadius: '999px', font: '700 44px IS', background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.3)' });
    const arr = el('div', '', n, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M5 12l7 7 7-7"/></svg>'); css(arr, { position: 'absolute', left: '50%', top: '820px', width: '90px', height: '90px', marginLeft: '-45px', color: '#8ea2ff' });
    const blk = el('div', '', n); css(blk, { position: 'absolute', inset: '-20px', background: '#000', opacity: 0 });
    cue(tTom - 0.05, 'logo_hit', 0.9); cue(tClick, 'pop', 0.7); cue(END - 2.4, 'shimmer', 0.5);
    return (t, T) => {
      a.update(t);
      const l = ease.out5(pr(t, 0.4, 0.6)); lock.style.opacity = l; lock.style.transform = `translateY(${(1 - l) * 40}px)`; sub.style.opacity = clamp((t - 0.7) * 3);
      const r = ease.back(pr(T, tClick - 0.2, 0.5)); row.style.opacity = clamp(r * 3); row.style.transform = `translateX(-50%) scale(${(0.8 + 0.2 * r) * (1 + 0.02 * Math.sin(T * 5))})`;
      arr.style.opacity = clamp((T - tClick) * 3); arr.style.transform = `translateY(${Math.sin(T * 7) * 14}px)`;
      blk.style.opacity = ease.in(pr(T, END - 0.6, 0.6));
    };
  }));
}

import { WORDS } from './lib.js';
function WORDS_END() { return WORDS[WORDS.length - 1].e; }
