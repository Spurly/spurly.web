/**
 * Discover results -> CSV. Pure: rows in, text out, so it can be tested without a
 * browser. One column set per tab, written for a person opening it in Excel or
 * Sheets (readable headers, full post text, real dates, links that open), not a
 * dump of our internal row objects.
 *
 *  - Companies: one row per company or school (the `Type` column says which).
 *  - Jobs: one row per job. The page groups jobs by company; a spreadsheet wants them flat.
 *  - Posts: one row per post, with the author's profile link and the whole post text.
 *
 * Safety: text comes from LinkedIn and is untrusted. A cell that starts with
 * `= + - @` would run as a formula in Excel/Sheets, so such text gets a leading `'`.
 * The file starts with a UTF-8 BOM so Excel reads names and text in any language correctly.
 */

import { buildCsvTable, csvCell, csvFilename, exportDate, yesNo } from 'src/shared/utils/csvTable.js';

export { csvCell, exportDate };

const companyUrl = (company) => {
  if (!company) return '';
  if (company.profileUrl) return company.profileUrl;
  return company.slug ? `https://www.linkedin.com/company/${company.slug}` : '';
};

function authorUrl(author) {
  if (!author) return '';
  if (author.isCompany) return author.publicIdentifier ? `https://www.linkedin.com/company/${author.publicIdentifier}` : '';
  const key = author.publicIdentifier || author.providerId;
  return key ? `https://www.linkedin.com/in/${key}` : '';
}

/** [header, getter] pairs per tab, in the order they appear in the file. */
export const EXPORT_COLUMNS = {
  companies: [
    ['Company', (c) => c.name],
    ['Type', (c) => (c.kind === 'school' ? 'School' : 'Company')],
    ['Industry', (c) => c.industry],
    ['Location', (c) => c.location],
    ['Followers', (c) => c.followersCount || ''],
    ['About', (c) => c.summary],
    ['LinkedIn URL', (c) => companyUrl(c)],
    ['LinkedIn Company ID', (c) => c.companyId],
  ],
  jobs: [
    ['Job Title', (j) => j.title],
    ['Company', (j) => j.company?.name],
    ['Location', (j) => j.location],
    ['Posted (UTC)', (j) => exportDate(j.postedAt)],
    ['Easy Apply', (j) => yesNo(j.easyApply)],
    ['Promoted', (j) => yesNo(j.promoted)],
    ['Reposted', (j) => yesNo(j.reposted)],
    ['Job URL', (j) => j.url],
    ['Company LinkedIn URL', (j) => companyUrl(j.company)],
    ['LinkedIn Job ID', (j) => j.jobId],
    ['LinkedIn Company ID', (j) => j.company?.companyId],
  ],
  posts: [
    ['Author', (p) => p.author?.name],
    ['Author Type', (p) => (p.author?.isCompany ? 'Company page' : 'Person')],
    ['Author Headline', (p) => p.author?.headline],
    ['Author LinkedIn URL', (p) => authorUrl(p.author)],
    ['Post', (p) => p.text],
    ['Posted (UTC)', (p) => exportDate(p.postedAt)],
    ['Posted (as shown)', (p) => p.postedAgo],
    ['Reactions', (p) => p.reactions],
    ['Comments', (p) => p.comments],
    ['Reposts', (p) => p.reposts],
    ['Is Repost', (p) => yesNo(p.isRepost)],
    ['Hiring Post', (p) => yesNo(Boolean(p.jobPosting))],
    ['Job Title (hiring post)', (p) => p.jobPosting?.title],
    ['Post URL', (p) => p.shareUrl],
    ['Author LinkedIn ID', (p) => p.author?.providerId],
  ],
};

/** Header row plus one row per item, as CSV text (with BOM). '' when there is nothing to export. */
export function buildDiscoverCsv(category, items) {
  return buildCsvTable(EXPORT_COLUMNS[category], items);
}

/** e.g. `spurly-posts-hiring-react-2026-10-30.csv`. A pasted URL search has no keywords to name it by. */
export function discoverExportFilename(category, query, now = new Date()) {
  return csvFilename([category, query?.url ? 'search-url' : query?.keywords], now);
}
