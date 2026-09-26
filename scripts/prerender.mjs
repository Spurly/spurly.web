/**
 * Build-time prerender for the public website. Runs after both Vite builds:
 *
 *   vite build                                   -> dist/        (browser)
 *   vite build --ssr src/entry-server.jsx ...    -> dist-ssr/    (Node)
 *   node scripts/prerender.mjs                   -> this file
 *
 * For every route in PUBLIC_ROUTES (src/products/pages/website/seo.js) it
 * renders the real app on the server and writes a static HTML file whose
 * <head> carries that page's own title / description / canonical / OG /
 * JSON-LD and whose #root already contains the page. Crawlers and link
 * previews get real content without running JS; the browser hydrates it.
 *
 * It also writes:
 *   dist/app.html     the untouched SPA shell (+ noindex) — vercel.json's
 *                     catch-all serves this for every non-public route, so a
 *                     /dashboard deep link never paints the marketing home.
 *   dist/sitemap.xml  generated from the same PUBLIC_ROUTES list.
 *
 * Fails the build loudly on anything unexpected: a silently skipped page
 * would ship an empty shell for that URL and nobody would notice.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SSR_ENTRY = path.join(ROOT, 'dist-ssr', 'entry-server.js');
const MANIFEST = path.join(DIST, '.vite', 'manifest.json');
const WEBSITE_DIR = 'src/products/pages/website/';

const SEO_BLOCK = /<!--seo:start[\s\S]*?<!--seo:end-->/;
const ROOT_DIV = '<div id="root"></div>';

function fail(msg) {
  console.error(`\n[prerender] ${msg}\n`);
  process.exit(1);
}

/** Stylesheets of the website's lazy chunks, from Vite's build manifest.
 *  Linked in <head> so the prerendered page is styled on first paint instead
 *  of flashing unstyled HTML until the lazy route chunks load. The entry
 *  chunk's CSS is skipped — Vite already links it in index.html. */
function websiteCss(manifest) {
  const css = new Set();
  const seen = new Set();
  const walk = (key) => {
    if (seen.has(key) || !manifest[key] || manifest[key].isEntry) return;
    seen.add(key);
    (manifest[key].css || []).forEach((f) => css.add(f));
    (manifest[key].imports || []).forEach(walk);
  };
  Object.keys(manifest).filter((k) => k.startsWith(WEBSITE_DIR)).forEach(walk);
  if (css.size === 0) fail(`no CSS found for ${WEBSITE_DIR} in the build manifest`);
  return [...css].map((f) => `<link rel="stylesheet" href="/${f}">`).join('\n');
}

function outFile(routePath) {
  // "/" -> index.html; "/blog" -> blog.html; "/blog/x" -> blog/x.html
  // (vercel.json cleanUrls serves /blog from blog.html).
  return routePath === '/'
    ? path.join(DIST, 'index.html')
    : path.join(DIST, `${routePath.slice(1)}.html`);
}

function sitemap(siteUrl, routes) {
  const urls = routes.map((r) => [
    '  <url>',
    `    <loc>${r.path === '/' ? siteUrl + '/' : siteUrl + r.path}</loc>`,
    `    <lastmod>${r.lastmod}</lastmod>`,
    `    <changefreq>${r.changefreq}</changefreq>`,
    `    <priority>${r.priority.toFixed(1)}</priority>`,
    '  </url>',
  ].join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
if (!SEO_BLOCK.test(template)) fail('index.html is missing the <!--seo:start--> … <!--seo:end--> markers');
if (!template.includes(ROOT_DIV)) fail(`index.html is missing ${ROOT_DIV}`);
if (!template.includes('<body>')) fail('index.html is missing a bare <body> tag');

const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
const cssLinks = websiteCss(manifest);

// 1. The SPA shell for every non-public route. Written BEFORE index.html is
//    overwritten with the prerendered home page.
const appShell = template.replace(SEO_BLOCK, (block) =>
  block.replace('<!--seo:end-->', '<meta name="robots" content="noindex" />\n<!--seo:end-->'),
);
await fs.writeFile(path.join(DIST, 'app.html'), appShell);

// 2. One static HTML file per public route.
const { render, PUBLIC_ROUTES, SITE_URL } = await import(pathToFileURL(SSR_ENTRY).href);

for (const route of PUBLIC_ROUTES) {
  const { html, head } = await render(route.path);
  if (!head.includes('<title')) fail(`${route.path} rendered no <title> — does the page render <Seo>?`);
  if (!html.includes('<h1')) fail(`${route.path} rendered no <h1> — prerender produced the fallback, not the page`);

  const page = template
    .replace(SEO_BLOCK, `${head}\n${cssLinks}`)
    .replace(ROOT_DIV, `<div id="root">${html}</div>`)
    // WebsiteLayout adds these on mount; stamping them here means website.css
    // (every selector is scoped under body.mkt) applies from first paint.
    .replace('<body>', '<body class="mkt" data-palette="violet">');

  const file = outFile(route.path);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, page);
  console.log(`[prerender] ${route.path.padEnd(58)} -> ${path.relative(ROOT, file)}`);
}

// 3. Sitemap from the same list.
await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap(SITE_URL, PUBLIC_ROUTES));
console.log(`[prerender] sitemap.xml (${PUBLIC_ROUTES.length} urls)`);

// The manifest was only needed here; don't publish it.
await fs.rm(path.join(DIST, '.vite'), { recursive: true, force: true });
