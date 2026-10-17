// Deterministic frame-by-frame recorder.
//
// Why: a live screen recording drops and holds frames, and anything rendered
// at < 1x looks soft. Here the page runs on a virtual clock (Playwright's fake
// timers for JS, Web Animations paused + seeked for CSS), every output frame
// is rendered exactly once at 2x device pixels, and the camera (zoom/pan) is
// applied afterwards from the 2x frames, so zoomed shots stay sharp.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const VIEW = { width: 1600, height: 1000 };
export const DPR = 2;
export const FPS = 60;
const FRAME_MS = 1000 / FPS;

export async function openStudio({ start = Date.now() } = {}) {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DPR, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.clock.install({ time: start });
  await page.addInitScript(() => {
    // CSS transitions/animations follow the virtual clock.
    const startOf = new WeakMap();
    window.__syncAnims = (vt) => {
      for (const a of document.getAnimations()) {
        if (a.id === '__keep') continue;
        if (!startOf.has(a)) startOf.set(a, vt - (a.currentTime || 0));
        a.pause();
        a.currentTime = Math.max(0, vt - startOf.get(a));
      }
    };
    // No spellcheck squiggles under typed demo text.
    const nospell = () => document.documentElement && document.documentElement.setAttribute('spellcheck', 'false');
    nospell(); new MutationObserver(() => document.querySelectorAll('input,textarea').forEach((el) => el.setAttribute('spellcheck', 'false'))).observe(document, { subtree: true, childList: true });
    // The demo pointer: drawn in-page so it is rendered at 2x with the UI.
    const boot = () => {
      if (document.getElementById('__cur')) return;
      const wrap = document.createElement('div');
      wrap.id = '__cur';
      wrap.innerHTML = `
        <div id="__ring" style="position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:radial-gradient(circle,rgba(59,91,219,.30) 0%,rgba(59,91,219,.18) 55%,rgba(59,91,219,0) 70%);opacity:0"></div>
        <svg id="__arrow" width="26" height="26" viewBox="0 0 26 26" style="position:absolute;left:-5px;top:-3px;overflow:visible;filter:drop-shadow(0 1.5px 2.5px rgba(10,14,40,.38)) drop-shadow(0 0 .5px rgba(10,14,40,.5))">
          <path d="M5.5 3.2 L5.5 21.2 L10.1 17.0 L13.2 23.6 L16.4 22.2 L13.4 15.7 L19.6 15.7 Z" fill="#11142e" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>
        </svg>`;
      Object.assign(wrap.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-300px,-300px)', willChange: 'transform' });
      document.documentElement.appendChild(wrap);
    };
    window.__cursor = (x, y, press, ring, ringOp) => {
      boot();
      const w = document.getElementById('__cur');
      w.style.transform = `translate(${x}px,${y}px)`;
      document.getElementById('__arrow').style.transform = `scale(${press})`;
      document.getElementById('__arrow').style.transformOrigin = '5px 3px';
      const r = document.getElementById('__ring');
      r.style.transform = `scale(${ring})`;
      r.style.opacity = String(ringOp);
    };
  });
  return { browser, ctx, page };
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export class Recorder {
  constructor(page, dir, { inflight = () => 0 } = {}) {
    this.page = page;
    this.dir = dir;
    this.inflight = inflight;
    this.vt = 0; // ms of virtual time since recording started
    this.n = 0;
    this.capturing = false;
    this.mouse = { x: 800, y: 500 };
    this.press = 1;
    this.clickAt = -1e9;
    this.clickPos = { x: 0, y: 0 };
    this.marks = {};
    this.rects = {};
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }

  async settle() {
    for (let i = 0; i < 200 && this.inflight() > 0; i++) await new Promise((r) => setTimeout(r, 4));
    await new Promise((r) => setTimeout(r, 12));
  }

  async frame() {
    await this.page.clock.runFor(FRAME_MS);
    this.vt += FRAME_MS;
    await this.settle();
    const since = this.vt - this.clickAt;
    const ring = since >= 0 && since < 520 ? 0.35 + 0.95 * easeOut(since / 520) : 0;
    const ringOp = since >= 0 && since < 520 ? 1 - easeOut(since / 520) : 0;
    await this.page.evaluate(([vt, c]) => { window.__syncAnims(vt); window.__cursor(...c); },
      [this.vt, [this.mouse.x, this.mouse.y, this.press, ring, ringOp]]);
    if (!this.capturing) return;
    if (this.dry) { this.n++; return; }
    this.cdp ||= await this.page.context().newCDPSession(this.page);
    const { data } = await this.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true, clip: { x: 0, y: 0, width: VIEW.width, height: VIEW.height, scale: DPR } });
    fs.writeFile(path.join(this.dir, `f${String(this.n++).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'), () => {});
  }

  async wait(ms) { const n = Math.round(ms / FRAME_MS); for (let i = 0; i < n; i++) await this.frame(); }
  mark(name) { this.marks[name] = (this.n * 1000) / FPS; }
  /** A scene change: frames before and after dissolve into each other in camera.py. */
  cut(name) { this.mark(name); (this.cuts ||= []).push(name); }
  /** Ease a scroll container (CSS selector) to scrollTop = top. */
  async scrollTo(selector, top, ms = 700) {
    const from = await this.page.evaluate((s) => document.querySelector(s).scrollTop, selector);
    const n = Math.max(2, Math.round(ms / FRAME_MS));
    for (let i = 1; i <= n; i++) {
      const y = from + (top - from) * easeInOut(i / n);
      await this.page.evaluate(([s, y]) => { document.querySelector(s).scrollTop = y; }, [selector, y]);
      await this.frame();
    }
  }
  async rect(name, locator) { const b = await locator.boundingBox(); this.rects[name] = b; return b; }

  async move(x, y, ms = 650) {
    const from = { ...this.mouse };
    const dx = x - from.x, dy = y - from.y;
    const dist = Math.hypot(dx, dy);
    // a gentle arc, like a hand on a trackpad
    const bend = Math.min(60, dist * 0.12);
    const nx = -dy / (dist || 1), ny = dx / (dist || 1);
    const n = Math.max(2, Math.round(ms / FRAME_MS));
    for (let i = 1; i <= n; i++) {
      const t = easeInOut(i / n);
      const arc = Math.sin(Math.PI * t) * bend;
      this.mouse = { x: from.x + dx * t + nx * arc, y: from.y + dy * t + ny * arc };
      await this.page.mouse.move(this.mouse.x, this.mouse.y);
      await this.frame();
    }
    this.mouse = { x, y };
  }

  async click() {
    for (const s of [0.94, 0.88, 0.86]) { this.press = s; await this.frame(); }
    await this.page.mouse.down();
    this.clickAt = this.vt;
    await this.frame();
    await this.page.mouse.up();
    for (const s of [0.9, 0.95, 1]) { this.press = s; await this.frame(); }
  }

  async clickOn(locator, { ms = 650, dx = 0, dy = 0, pause = 90 } = {}) {
    const b = await locator.boundingBox();
    if (!b) throw new Error('no box: ' + locator);
    await this.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, ms);
    await this.wait(pause);
    await this.click();
  }

  async type(text, perChar = 70) {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      await this.wait(perChar * (0.75 + rnd() * 0.5));
    }
  }

  async waitFor(locator, maxMs = 3000) {
    for (let t = 0; t < maxMs; t += FRAME_MS) {
      if (await locator.isVisible().catch(() => false)) return;
      await this.frame();
    }
    throw new Error('timeout waiting for ' + locator);
  }

  save(extra = {}) {
    fs.writeFileSync(path.join(this.dir, 'meta.json'), JSON.stringify({ fps: FPS, frames: this.n, view: VIEW, dpr: DPR, marks: this.marks, rects: this.rects, cuts: this.cuts || [], ...extra }, null, 1));
  }
}
