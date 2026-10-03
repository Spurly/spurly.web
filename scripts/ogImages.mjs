/**
 * Per-page Open Graph cards (1200x630 PNG), generated at build time.
 *
 * scripts/prerender.mjs calls generateOgImages() once for the whole route list
 * and writes dist/og/<slug>.png, where <slug> comes from ogSlug() in
 * src/products/pages/website/seo.js (the same function <Seo> uses to build each
 * page's og:image URL, so the two cannot drift).
 *
 * satori lays the card out (it reads Instrument Sans from
 * @fontsource, which ships .woff files) and @resvg/resvg-js rasterises the SVG.
 * Neither needs a browser or system fonts, so it works the same on Vercel.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (pkg, file) => fs.readFile(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'files', file));

const PAPER = '#f5f7fc';
const INK = '#1a1d3f';
const INK_3 = '#666d8a';
const TEAL = '#3b5bdb';
const APRICOT = '#c9d4ff';

/** "Blog — LinkedIn outreach guides | Spurly" -> "Blog — LinkedIn outreach guides";
 *  "Spurly — LinkedIn Lead Capture ..." -> "LinkedIn Lead Capture ..." */
export function cardTitle(title) {
  const parts = title.split(/\s+[—|–]\s+/).map((p) => p.trim()).filter((p) => p && p !== 'Spurly');
  return parts.join(' — ') || title;
}

function fontSizeFor(text) {
  if (text.length > 90) return 52;
  if (text.length > 60) return 62;
  return 76;
}

function card(title, iconSrc) {
  const text = cardTitle(title);
  const decor = (style) => ({ type: 'div', props: { style: { position: 'absolute', borderRadius: '50%', ...style } } });
  return {
    type: 'div',
    props: {
      style: {
        width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: PAPER, padding: '64px 72px', position: 'relative', fontFamily: 'Instrument Sans', color: INK,
      },
      children: [
        decor({ right: -140, top: -160, width: 460, height: 460, background: APRICOT }),
        decor({ right: 130, top: 330, width: 150, height: 150, background: TEAL, opacity: 0.9 }),
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center' },
            children: [
              { type: 'img', props: { src: iconSrc, width: 56, height: 56, style: { borderRadius: 14 } } },
              { type: 'div', props: { style: { marginLeft: 18, fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 40 }, children: 'Spurly' } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', maxWidth: 820, fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: fontSizeFor(text), lineHeight: 1.08, letterSpacing: -2, lineClamp: 3 },
            children: text,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28, color: INK_3 },
            children: [
              { type: 'div', props: { style: { display: 'flex' }, children: 'getspurly.com' } },
              { type: 'div', props: { style: { display: 'flex', background: INK, color: PAPER, padding: '12px 26px', borderRadius: 999, fontWeight: 500 }, children: 'LinkedIn outreach that runs itself.' } },
            ],
          },
        },
      ],
    },
  };
}

/**
 * @param {{ slug: string, title: string }[]} pages
 * @param {{ outDir: string, iconPath: string }} opts
 */
export async function generateOgImages(pages, { outDir, iconPath }) {
  const [sans700, sans500, sans400, icon] = await Promise.all([
    font('@fontsource/instrument-sans', 'instrument-sans-latin-700-normal.woff'),
    font('@fontsource/instrument-sans', 'instrument-sans-latin-500-normal.woff'),
    font('@fontsource/instrument-sans', 'instrument-sans-latin-400-normal.woff'),
    fs.readFile(iconPath),
  ]);
  const fonts = [
    { name: 'Instrument Sans', data: sans700, weight: 700, style: 'normal' },
    { name: 'Instrument Sans', data: sans400, weight: 400, style: 'normal' },
    { name: 'Instrument Sans', data: sans500, weight: 500, style: 'normal' },
  ];
  const iconSrc = `data:image/png;base64,${icon.toString('base64')}`;

  await fs.mkdir(outDir, { recursive: true });
  for (const { slug, title } of pages) {
    const svg = await satori(card(title, iconSrc), { width: 1200, height: 630, fonts });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
    await fs.writeFile(path.join(outDir, `${slug}.png`), png);
  }
}
