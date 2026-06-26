/* ============================================================
   Split-flap whooshes — synthesized with the Web Audio API, no assets.
   Four cinematic whoosh variants; a random one plays each time the board
   changes word. Sound is OFF by default and is enabled when the user taps
   the speaker toggle (that tap is also the gesture browsers require before
   any audio can play).
   ============================================================ */

let ctx = null;
let noiseBuffer = null;
let armed = false;
let enabled = false; // muted until the user taps the speaker

const BUF_DUR = 1.0;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * BUF_DUR), ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

function unlock() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume();
}

/* Resume the context on any early gesture so it's ready the moment the
   user enables sound. Does NOT enable sound by itself. */
export function armFlapSound() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const events = ["pointerdown", "touchstart", "click", "keydown"];
  events.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
}

export function isSoundEnabled() {
  return enabled;
}

/* Called from the speaker toggle (inside a user gesture). */
export function setSoundEnabled(v) {
  enabled = !!v;
  if (enabled) unlock();
  return enabled;
}

function noiseSrc() {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer;
  return s;
}

/* ---- Whoosh variants ---- */
function whooshDeep(now) {
  const dur = 0.8;
  const s = noiseSrc();
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.Q.value = 1.0;
  f.frequency.setValueAtTime(200, now);
  f.frequency.exponentialRampToValueAtTime(1200, now + dur * 0.5);
  f.frequency.exponentialRampToValueAtTime(300, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.12, now + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(f); f.connect(g); g.connect(ctx.destination);
  s.start(now); s.stop(now + dur);
}

function whooshAiry(now) {
  const dur = 0.5;
  const s = noiseSrc();
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.7;
  f.frequency.setValueAtTime(1500, now);
  f.frequency.exponentialRampToValueAtTime(6000, now + dur * 0.45);
  f.frequency.exponentialRampToValueAtTime(2000, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.10, now + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(f); f.connect(g); g.connect(ctx.destination);
  s.start(now); s.stop(now + dur);
}

function whooshTail(now) {
  const dur = 0.3;
  const s = noiseSrc();
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.1;
  f.frequency.setValueAtTime(900, now);
  f.frequency.exponentialRampToValueAtTime(5200, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.11, now + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(f); f.connect(g); g.connect(ctx.destination);
  s.start(now); s.stop(now + dur);
  // airy shimmer tail
  const ts = noiseSrc();
  const tf = ctx.createBiquadFilter();
  tf.type = "highpass";
  tf.frequency.value = 4000;
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0.0001, now + 0.05);
  tg.gain.linearRampToValueAtTime(0.045, now + 0.12);
  tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  ts.connect(tf); tf.connect(tg); tg.connect(ctx.destination);
  ts.start(now + 0.05); ts.stop(now + 0.7);
}

function whooshReverse(now) {
  const dur = 0.55;
  const s = noiseSrc();
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(600, now);
  f.frequency.exponentialRampToValueAtTime(5000, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.13, now + dur * 0.85); // swell in
  g.gain.linearRampToValueAtTime(0.0001, now + dur); // quick cut
  s.connect(f); f.connect(g); g.connect(ctx.destination);
  s.start(now); s.stop(now + dur);
}

const WHOOSHES = [whooshDeep, whooshAiry, whooshTail, whooshReverse];

/* A random whoosh. No-op unless sound is enabled and the context runs. */
export function playFlapWhoosh() {
  if (!enabled) return;
  if (!ctx || ctx.state !== "running" || !noiseBuffer) return;
  const now = ctx.currentTime;
  const fn = WHOOSHES[Math.floor(Math.random() * WHOOSHES.length)];
  fn(now);
}
