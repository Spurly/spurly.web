/**
 * /llms.txt — a plain-text summary of the site for AI crawlers (llmstxt.org
 * format). Generated at build from the same route list as the sitemap, so it
 * can't list a page that doesn't exist. No major AI engine has confirmed using
 * it (SEO_MASTER_PLAN N14); it is here because it costs nothing.
 *
 * Only describe what ships (SEO_CONTENT_PLAN §3, "Market now").
 */

const SUMMARY =
  'Spurly is an AI SDR for LinkedIn: it finds high-intent leads that match your ICP, writes personalized messages with AI and follows up until they reply, while you approve every message. It is built for founders and B2B sales teams. Connect your LinkedIn account once, then find the right people, ' +
  'send connection requests and multi-step follow-ups at a safe daily pace, and reply from one unified inbox, ' +
  'from the cloud, around the clock, so campaigns keep going with your laptop closed. A Chrome extension captures profiles from ' +
  'LinkedIn and Sales Navigator pages. One plan: $24.99/month (₹2,499/month in India) with a 7-day free trial; ' +
  'no card is needed to start the trial. Spurly is designed to stay within LinkedIn\'s limits, ' +
  'but no tool can guarantee LinkedIn won\'t restrict an account.';

export function decodeHtml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * @param {string} siteUrl e.g. https://www.getspurly.com
 * @param {{ path: string, title: string, description: string }[]} pages
 */
export function buildLlmsTxt(siteUrl, pages) {
  const link = (p) => `- [${p.title}](${p.path === '/' ? siteUrl + '/' : siteUrl + p.path}): ${p.description}`;
  const blog = pages.filter((p) => p.path.startsWith('/blog/'));
  const main = pages.filter((p) => !p.path.startsWith('/blog/'));
  return [
    '# Spurly',
    '',
    `> ${SUMMARY}`,
    '',
    '## Pages',
    '',
    ...main.map(link),
    '',
    '## Blog posts',
    '',
    ...blog.map(link),
    '',
  ].join('\n');
}
