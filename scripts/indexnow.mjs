// Tell IndexNow (Bing, Yandex, others) which URLs changed.
// Run AFTER a deploy is live: the service fetches the key file from the site
// to verify ownership, so pinging before the deploy would fail.
//   npm run indexnow                      -> submits every URL in the live sitemap
//   npm run indexnow -- /pricing /about   -> submits just those paths
// Uses node:https only, so it works on any Node version (no global fetch needed).
import https from 'node:https';

const HOST = 'www.getspurly.com';
const KEY = 'beaad9a3f26d5269d60b32af950c8d2d';
const ORIGIN = `https://${HOST}`;

function request(url, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) } : {},
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function sitemapUrls() {
  const res = await request(`${ORIGIN}/sitemap.xml`);
  if (res.status !== 200) throw new Error(`sitemap fetch failed: ${res.status}`);
  return [...res.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const paths = process.argv.slice(2);
  const urlList = paths.length
    ? paths.map((p) => (p.startsWith('http') ? p : `${ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`))
    : await sitemapUrls();

  const keyCheck = await request(`${ORIGIN}/${KEY}.txt`);
  if (keyCheck.status !== 200 || keyCheck.text.trim() !== KEY) {
    throw new Error('The key file is not live yet at ' + ORIGIN + '/' + KEY + '.txt. Deploy first, then run this again.');
  }

  const res = await request('https://api.indexnow.org/indexnow', {
    method: 'POST',
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList }),
  });
  console.log(`IndexNow: submitted ${urlList.length} URLs, HTTP ${res.status}`);
  if (res.status >= 400) process.exit(1);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
