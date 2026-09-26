/**
 * Server entry for build-time prerendering — NOT shipped to the browser.
 *
 * Built by `vite build --ssr src/entry-server.jsx` and driven by
 * scripts/prerender.mjs, which calls render(url) for every public route and
 * writes the result into dist/<route>.html. Renders the real AppTree (same
 * providers, same routes, same lazy chunks) so the browser can hydrate it.
 *
 * `prerenderToNodeStream` (not renderToString) because the routes are lazy:
 * it waits for every Suspense boundary to resolve, so the HTML holds the page
 * itself, never the RouteFallback spinner.
 */
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom/server';
import { AppTree } from 'src/app/App.jsx';

export { PUBLIC_ROUTES, SITE_URL } from 'src/products/pages/website/seo.js';

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

export async function render(url) {
  const helmetContext = {};
  const { prelude } = await prerenderToNodeStream(
    <AppTree
      Router={StaticRouter}
      routerProps={{ location: url }}
      helmetContext={helmetContext}
    />,
  );
  const html = await streamToString(prelude);
  const { helmet } = helmetContext;
  const head = helmet
    ? [helmet.title, helmet.meta, helmet.link, helmet.script].map((t) => t.toString()).join('\n')
    : '';
  return { html, head };
}
