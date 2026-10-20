// Deterministic motion-graphics runtime. Everything is a pure function of time t (seconds).
// window.render(t) sets the DOM for that instant and resolves when every image is decoded.

export const W = 1920, H = 1080;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  out5: (t) => 1 - Math.pow(1 - t, 5),
  in: (t) => t * t * t,
  inout: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  smooth: (t) => t * t * t * (t * (6 * t - 15) + 10),
  back: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  spring: (t) => (t >= 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(t * 10.5)),
};
/** progress of t through [a, a+d] */
export const pr = (t, a, d) => clamp((t - a) / d);

export function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export function css(e, o) { for (const k in o) e.style[k] = o[k]; return e; }

// ── words / timing ──
export const WORDS = [];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$]/g, '');
let cursor = 0;
/** Start time of the first occurrence of phrase at or after the cursor (cursor advances). */
export function at(phrase, opts = {}) {
  const r = find(phrase, opts); return opts.end ? r.e : r.s;
}
export function find(phrase, { from = null, keep = false } = {}) {
  const ps = phrase.split(/\s+/).map(norm).filter(Boolean);
  const start = from == null ? cursor : from;
  for (let i = start; i < WORDS.length; i++) {
    let ok = true;
    for (let k = 0; k < ps.length; k++) {
      if (!WORDS[i + k] || norm(WORDS[i + k].w) !== ps[k]) { ok = false; break; }
    }
    if (ok) {
      const r = { s: WORDS[i].s, e: WORDS[i + ps.length - 1].e, i };
      if (!keep) cursor = i + ps.length;
      return r;
    }
  }
  throw new Error('phrase not found: ' + phrase + ' after ' + start);
}
export function resetCursor() { cursor = 0; }

// ── sound cues (collected at build time, read by the audio mixer) ──
export const CUES = [];
export function cue(t, name, gain = 1, extra = {}) { CUES.push({ t: +t.toFixed(3), name, gain, ...extra }); }

// ── kinetic text ──
// `*w*` = gradient highlight, `_w_` = editorial italic serif, `~w~` = red strike, `^w^` = mint.
// Returns {node, update(t)} where t is local seconds since the text starts.
export function kinetic(parent, text, o = {}) {
  const {
    size = 96, weight = 700, stagger = 0.06, dur = 0.5, style = 'rise', color = '#fff', align = 'center',
    lh = 1.08, maxw = 1600, ls = -0.025, outAt = null, outDur = 0.3, times = null, cls = '',
  } = o;
  const box = el('div', 'kt ' + cls, parent);
  css(box, { fontSize: size + 'px', fontWeight: weight, color, textAlign: align, lineHeight: lh, maxWidth: maxw + 'px', letterSpacing: ls + 'em' });
  const words = [];
  text.split(/(\n| )/).forEach((tok) => {
    if (tok === ' ' || tok === '') return;
    if (tok === '\n') { el('br', '', box); return; }
    let kind = '';
    let w = tok;
    if (/^\*.*\*[.,!?]*$/.test(w)) { kind = 'hl'; w = w.replace(/\*/g, ''); }
    else if (/^_.*_[.,!?]*$/.test(w)) { kind = 'serif'; w = w.replace(/_/g, ''); }
    else if (/^~.*~[.,!?]*$/.test(w)) { kind = 'strike'; w = w.replace(/~/g, ''); }
    else if (/^\^.*\^[.,!?]*$/.test(w)) { kind = 'mint'; w = w.replace(/\^/g, ''); }
    const mask = el('span', 'kw-mask', box);
    const inner = el('span', 'kw ' + kind, mask, w.replace(/&/g, '&amp;'));
    words.push({ mask, inner, kind });
    box.appendChild(document.createTextNode(' '));
  });
  function update(t) {
    words.forEach((w, k) => {
      const t0 = times ? times[k] : k * stagger;
      const u = pr(t, t0, dur);
      let o2 = 1, y = 0, s = 1, rot = 0, x = 0;
      if (style === 'rise') { const e = ease.out5(u); y = (1 - e) * 105; o2 = u > 0 ? 1 : 0; }
      else if (style === 'pop') { const e = ease.back(u); s = 0.4 + 0.6 * e; o2 = clamp(u * 3); }
      else if (style === 'slam') { const e = ease.out5(u); s = 1.9 - 0.9 * e; o2 = clamp(u * 4); }
      else if (style === 'fade') { o2 = ease.out(u); y = (1 - ease.out(u)) * 18; }
      else if (style === 'drop') { const e = ease.spring(u); y = (1 - e) * -120; o2 = clamp(u * 4); }
      if (outAt != null && t > outAt) {
        const v = ease.in(pr(t, outAt, outDur)); y -= v * 60; o2 *= 1 - v;
      }
      w.inner.style.transform = `translate(${x}px, ${y}%) scale(${s}) rotate(${rot}deg)`;
      w.inner.style.opacity = o2;
      if (w.kind === 'strike') w.inner.style.setProperty('--sk', clamp((t - t0 - dur * 0.6) / 0.3));
    });
  }
  update(-1);
  return { node: box, update, words };
}

// ── counters ──
export function fmtMoney(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

// ── image decode tracking ──
export const pending = new Set();
export function setSrc(img, src) {
  if (img.dataset.src === src) return;
  img.dataset.src = src;
  img.src = src;
  const p = img.decode().catch(() => {});
  pending.add(p); p.finally(() => pending.delete(p));
}
export const FX = { voice: [], amb: [] };
/** First occurrence of phrase whose start is at or after time t (does not move the cursor). */
export function findAfter(phrase, t) {
  const i = WORDS.findIndex((w) => w.s >= t - 0.01);
  return find(phrase, { from: i, keep: true });
}
