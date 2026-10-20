import { W, H, clamp, lerp, ease, pr, el, css, WORDS, CUES, pending, cue } from './lib.js';

const words = await (await fetch('words_out.json')).json();
WORDS.push(...words);
const { buildScenes, PALETTES, MUSIC } = await import('./scenes.js');

const root = document.getElementById('scenes');
const scenes = buildScenes(root);   // [{t0,t1,node,update,enter,enterDur,pal}]
scenes.sort((a, b) => a.t0 - b.t0);
for (let k = 0; k < scenes.length; k++) {
  const s = scenes[k];
  s.enterDur = s.enterDur ?? (s.enter === 'cut' ? 0 : s.enter === 'glitch' ? 0.3 : s.enter === 'whip' ? 0.34 : 0.4);
  const nx = scenes[k + 1];
  s.tEnd = nx ? Math.max(s.t1, nx.t0 + (nx.enterDur ?? 0.42)) : s.t1;
  // transition sounds
  if (k > 0 && s.enter !== 'cut' && !s.silentEnter) cue(s.t0 - 0.06, s.enter === 'zoom' ? 'whoosh_zoom' : s.enter === 'glitch' ? 'glitch' : 'whoosh', s.enterGain ?? 0.8);
}
export const TOTAL = Math.max(...scenes.map((s) => s.t1));

// ── background: aurora blobs, palettes cross-faded over time ──
const bg = document.getElementById('bg');
const blobs = [0, 1, 2, 3].map(() => el('div', 'blob', bg));
const grid = document.getElementById('grid');
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, u) => a.map((v, i) => Math.round(lerp(v, b[i], u)));
function palAt(t) {
  let cur = PALETTES[0], prev = PALETTES[0], u = 1;
  for (const p of PALETTES) {
    if (t >= p.t) { prev = cur; cur = p; u = clamp((t - p.t) / (p.dur ?? 0.6)); }
  }
  const P = (k) => mix(hex(prev[k]), hex(cur[k]), ease.inout(u));
  return { base: P('base'), b: [P('b0'), P('b1'), P('b2'), P('b3')], grid: lerp(prev.grid ?? 1, cur.grid ?? 1, u), vig: lerp(prev.vig ?? 1, cur.vig ?? 1, u), light: lerp(prev.light ? 1 : 0, cur.light ? 1 : 0, u) };
}
function drawBg(t) {
  const p = palAt(t);
  document.getElementById('stage').style.background = `rgb(${p.base})`;
  const pos = [[0.18, 0.12, 900], [0.82, 0.22, 820], [0.62, 0.92, 1000], [0.08, 0.86, 700]];
  blobs.forEach((b, i) => {
    const [x, y, s] = pos[i];
    const dx = Math.sin(t * 0.21 + i * 1.7) * 90, dy = Math.cos(t * 0.17 + i * 2.3) * 70;
    css(b, { width: s + 'px', height: s + 'px', left: `calc(${x * 100}% - ${s / 2}px + ${dx}px)`, top: `calc(${y * 100}% - ${s / 2}px + ${dy}px)`, background: `rgb(${p.b[i]})`, opacity: 0.55 + 0.1 * Math.sin(t * 0.5 + i) });
  });
  grid.style.opacity = p.grid;
  grid.style.backgroundImage = p.light > 0.5 ? 'radial-gradient(rgba(30,40,110,.10) 1.2px,transparent 1.3px)' : '';
  document.getElementById('vig').style.opacity = p.vig;
}

// ── captions ──
const capBox = document.getElementById('cap');
const chunks = [];
{
  let cur = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= 4 || w.s - prev.e > 0.24 || /[.,!?]$/.test(prev.w))) { chunks.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) chunks.push(cur);
}
chunks.forEach((c, k) => { c.s = c[0].s; c.e = c[c.length - 1].e; c.next = chunks[k + 1]; });
let capShown = null, capNodes = [];
function drawCaptions(t, hidden, shift = 0) {
  capBox.style.transform = `translateX(${shift}px)`;
  const c = chunks.find((c) => t >= c.s - 0.06 && t < Math.min(c.next ? c.next.s - 0.06 : 1e9, c.e + 0.7));
  if (hidden || !c) { capBox.style.opacity = 0; document.getElementById('capfade').style.opacity = 0; return; }
  document.getElementById('capfade').style.opacity = 1;
  capBox.style.opacity = 1;
  if (capShown !== c) {
    capBox.innerHTML = '';
    const line = el('div', 'line', capBox);
    capNodes = c.map((w) => { const m = el('span', 'wm', line); return el('span', 'w', m, w.w.replace(/[,]$/, '')); });
    capShown = c;
  }
  c.forEach((w, i) => {
    const u = ease.out5(pr(t, w.s - 0.07, 0.22));
    capNodes[i].style.transform = `translateY(${(1 - u) * 100}%)`;
    const nx = c[i + 1] || c.next?.[0];
    const on = t >= w.s - 0.03 && t < Math.min(w.e + 0.12, nx ? nx.s - 0.03 : 1e9);
    capNodes[i].className = 'w' + (on ? ' on' : '');
  });
  capBox.firstChild.style.opacity = 1 - clamp((t - (c.next ? c.next.s - 0.06 : c.e + 0.7) + 0.1) / 0.1);
}

// ── frame ──
const flash = document.getElementById('flash');
window.render = async (t) => {
  drawBg(t);
  let capHidden = false, fl = 0, capShift = 0, capDark = false;
  for (const s of scenes) {
    const vis = t >= s.t0 && t < s.tEnd;
    if (!vis) { if (s.node.style.display !== 'none') s.node.style.display = 'none'; continue; }
    s.node.style.display = 'block';
    const lt = t - s.t0;
    s.update(lt, t);
    // entry
    let tr = '', op = 1, fil = '';
    if (lt < s.enterDur) {
      const u = lt / s.enterDur, e = ease.out5(u);
      if (s.enter === 'zoom') { tr = `scale(${1.22 - 0.22 * e})`; op = clamp(u * 3); fl = Math.max(fl, 0.22 * (1 - u)); }
      else if (s.enter === 'whip') { tr = `translateX(${(1 - e) * 110}%) skewX(${-(1 - e) * 8}deg)`; fil = `blur(${Math.sin(Math.PI * u) * 7}px)`; }
      else if (s.enter === 'up') { tr = `translateY(${(1 - e) * 100}%)`; }
      else if (s.enter === 'drop') { tr = `translateY(${(1 - ease.spring(u)) * -100}%)`; }
      else if (s.enter === 'glitch') { const j = Math.sin(lt * 140) * (1 - u) * 40; tr = `translateX(${j}px)`; fil = u < 0.7 ? `hue-rotate(${(1 - u) * 90}deg) saturate(${1 + (1 - u) * 2})` : ''; fl = Math.max(fl, 0.15 * (1 - u)); }
      else if (s.enter === 'fade') { op = ease.out(u); }
    }
    // exit (while the next scene enters)
    if (t >= s.t1) {
      const nx = scenes[scenes.indexOf(s) + 1];
      const u = clamp((t - s.t1) / Math.max(0.01, s.tEnd - s.t1)), e = ease.out5(u);
      const kind = nx ? nx.enter : 'fade';
      if (kind === 'zoom') { tr = `scale(${1 + 0.35 * ease.out(u)})`; op = 1 - clamp(u * 5); }
      else if (kind === 'whip') { tr = `translateX(${-e * 110}%) skewX(${e * 8}deg)`; fil = `blur(${Math.sin(Math.PI * u) * 7}px)`; }
      else if (kind === 'up') { tr = `translateY(${-e * 100}%)`; }
      else if (kind === 'drop') { tr = `translateY(${e * 100}%)`; }
      else if (kind === 'fade') { op = 1 - u; }
      else { op = 0; }
    }
    s.node.style.transform = tr; s.node.style.opacity = op; s.node.style.filter = fil;
    if (s.noCaptions && t < s.t1) capHidden = true;
    if (s.capShift && t < s.t1) capShift = s.capShift;
    if (t < s.t1) capDark = !!s.capDark;
    if (s.flash) fl = Math.max(fl, s.flash(lt) || 0);
  }
  flash.style.opacity = fl;
  capBox.classList.toggle('dark', capDark); document.getElementById('capfade').style.display = capDark ? 'none' : '';
  drawCaptions(t, capHidden, capShift);
  // let layout + decodes settle
  await Promise.all([...pending]);
  await new Promise(requestAnimationFrame);
};
window.TOTAL = TOTAL;
window.CUES = CUES; window.FX = (await import('./lib.js')).FX;
window.MUSIC = MUSIC;
window.ready = true;
