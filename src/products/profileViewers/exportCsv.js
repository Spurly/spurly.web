import { buildCsvTable, csvFilename, exportDate } from 'src/shared/utils/csvTable.js';

/**
 * Profile viewers -> CSV. LinkedIn only ever says "viewed 5h ago", so the
 * stored time is an ESTIMATE good to the unit it came from. The file says so:
 * `Last viewed (approx. UTC)` plus `Precision` (hour / day / week / month),
 * instead of a falsely exact timestamp. Only identified viewers are exported;
 * private viewers have no name or profile to give.
 */

const DEGREE = { 1: '1st', 2: '2nd', 3: '3rd' };

export const VIEWER_EXPORT_COLUMNS = [
  ['Name', (v) => v.fullName],
  ['Headline', (v) => v.headline],
  ['Connection', (v) => DEGREE[Math.min(Number(v.connectionDegree), 3)] ?? ''],
  ['Last viewed (approx. UTC)', (v) => exportDate(v.lastViewedAt)],
  ['Precision', (v) => v.lastViewedPrecision],
  ['First seen (UTC)', (v) => exportDate(v.firstSeenAt)],
  ['Times seen', (v) => v.viewsSeen],
  ['LinkedIn URL', (v) => v.profileUrl],
  ['LinkedIn ID', (v) => v.providerId],
];

export function buildViewersCsv(viewers) {
  return buildCsvTable(VIEWER_EXPORT_COLUMNS, viewers);
}

/** `spurly-profile-viewers-2nd-2026-10-30.csv`; the connection level is in the name when one is filtered. */
export function viewersExportFilename(degreeLabel, now = new Date()) {
  return csvFilename(['profile-viewers', degreeLabel], now);
}
