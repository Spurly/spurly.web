// node render.mjs --from 0 --to 50 --fps 30 --scale 0.5 --out preview.mp4 [--q 85] [--png]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = +arg('from', 0), FPS = +arg('fps', 30), SCALE = +arg('scale', 1), OUT = arg('out', 'preview.mp4');
const PNG = process.argv.includes('--png'), Q = +arg('q', 88), STILLS = arg('stills', null);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await page.goto('http://localhost:8123/comp/index.html');
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const TOTAL = await page.evaluate(() => window.TOTAL);
const TO = Math.min(+arg('to', TOTAL), TOTAL);
const cdp = await page.context().newCDPSession(page);
const shot = async () => (await cdp.send('Page.captureScreenshot', { format: PNG ? 'png' : 'jpeg', quality: PNG ? undefined : Q, optimizeForSpeed: true, captureBeyondViewport: false, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: SCALE } })).data;
if (STILLS) {
  const fs = await import('node:fs');
  fs.mkdirSync('stills', { recursive: true });
  for (const s of STILLS.split(',')) { await page.evaluate((t) => window.render(t), +s); if (process.argv.includes('--nocap')) await page.evaluate(() => { document.getElementById('cap').style.opacity = 0; document.getElementById('capfade').style.opacity = 0; }); fs.writeFileSync(`stills/s${(+s).toFixed(2)}.jpg`, Buffer.from(await shot(), 'base64')); }
  await browser.close(); process.exit(0);
}
const fs = await import('node:fs');
fs.writeFileSync('cues.json', JSON.stringify(await page.evaluate(() => ({ cues: window.CUES, music: window.MUSIC, total: window.TOTAL, fx: window.FX })), null, 1));
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  ...(PNG ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-tune', 'animation'] : ['-c:v', 'libx264', '-preset', arg('preset', 'veryfast'), '-crf', arg('crf', '20'), '-pix_fmt', 'yuv420p']), OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
const n0 = Math.round(FROM * FPS), n1 = Math.round(TO * FPS);
const t0 = Date.now();
for (let i = n0; i < n1; i++) {
  await page.evaluate((t) => window.render(t), i / FPS);
  const buf = Buffer.from(await shot(), 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if ((i - n0) % 150 === 0) console.log(`${i - n0}/${n1 - n0}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r));
await browser.close();
console.log('done', OUT, ((Date.now() - t0) / 1000).toFixed(0) + 's');
