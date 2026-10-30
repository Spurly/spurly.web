import { buildCsvTable, csvFilename, exportDate } from 'src/shared/utils/csvTable.js';

/**
 * Leads -> CSV (the Leads page "Export CSV"). One row per lead, with what the
 * table shows plus what it hides: the full headline, the real dates, the
 * LinkedIn link. Blank where we do not know it yet: Title and Company fill in
 * only once a lead is opened or enriched, so an empty cell is "not resolved
 * yet", not an error. No email or phone: the Leads list does not carry them.
 */

const DEGREE = { 1: '1st', 2: '2nd', 3: '3rd' };
const ENRICHMENT = { none: 'Not enriched', queued: 'Queued', enriching: 'Enriching', enriched: 'Enriched', failed: 'Failed' };

/** Same rule as the Status column: 1st degree is Connected, an invite out is Invited, else New. */
function status(lead) {
  if (Number(lead.connectionDegree) === 1) return 'Connected';
  if (lead.pendingInvitationSentAt || lead.pendingInvitationId) return 'Invited';
  return 'New';
}

export const LEAD_EXPORT_COLUMNS = [
  ['Name', (l) => l.name],
  ['Title', (l) => l.currentTitle],
  ['Company', (l) => l.companyName],
  ['Location', (l) => l.location],
  ['Headline', (l) => l.headline],
  ['Connection', (l) => DEGREE[Number(l.connectionDegree)] ?? ''],
  ['Status', (l) => status(l)],
  ['Invite sent (UTC)', (l) => exportDate(l.pendingInvitationSentAt)],
  ['Last message sent (UTC)', (l) => exportDate(l.lastMessageSentAt)],
  ['Connected on (UTC)', (l) => exportDate(l.connectedAt)],
  ['Imported on (UTC)', (l) => exportDate(l.createdAt)],
  ['Enrichment', (l) => ENRICHMENT[l.enrichmentStatus] ?? ''],
  ['Followers (approx.)', (l) => (l.followersCount > 0 ? l.followersCount : '')],
  ['LinkedIn Premium', (l) => (l.isPremium === true ? 'Yes' : l.isPremium === false ? 'No' : '')],
  ['LinkedIn URL', (l) => l.profileUrl],
];

export function buildLeadsCsv(leads) {
  return buildCsvTable(LEAD_EXPORT_COLUMNS, leads);
}

/** `spurly-leads-<audience>-2026-10-30.csv`; the audience name is only there when one is open. */
export function leadsExportFilename(audienceName, now = new Date()) {
  return csvFilename(['leads', audienceName], now);
}
