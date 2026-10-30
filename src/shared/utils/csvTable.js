/**
 * Shared CSV building for the "Export CSV" buttons (Discover, Leads, Profile
 * viewers). Pure: rows in, text out. Each page owns its column list and calls
 * `buildCsvTable`; the escaping rules live here once.
 *
 * Text can come from LinkedIn or from people's own notes, so it is untrusted: a
 * cell that starts with `= + - @` would run as a formula in Excel/Sheets, and
 * gets a leading `'`. The file starts with a UTF-8 BOM so Excel reads names and
 * text in any language correctly. Download with `downloadFile` from csvExport.js.
 */

const BOM = '﻿';
const FORMULA_START = /^[=+\-@\t\r]/;

export const yesNo = (v) => (v ? 'Yes' : 'No');

/** One CSV cell. Numbers stay numbers (a negative one is not a formula); text is quoted and formula-guarded. */
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return yesNo(value);
  let s = String(value).replace(/\r\n?/g, '\n');
  if (FORMULA_START.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** "2026-10-30 08:15" in UTC, or '' when the value is missing or not a date. */
export function exportDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16).replace('T', ' ');
}

/**
 * `columns` is [[header, (item) => value], ...]. Header row plus one row per
 * item, as CSV text with a BOM. '' when there is nothing to export (never a header-only file).
 */
export function buildCsvTable(columns, items) {
  if (!Array.isArray(columns) || !Array.isArray(items) || items.length === 0) return '';
  const header = columns.map(([name]) => csvCell(name)).join(',');
  const rows = items.map((item) => columns.map(([, get]) => csvCell(get(item ?? {}))).join(','));
  return BOM + [header, ...rows].join('\r\n') + '\r\n';
}

const slug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

/** `spurly-<parts...>-<day>.csv`; empty parts are left out. */
export function csvFilename(parts, now = new Date()) {
  return ['spurly', ...parts.map(slug), now.toISOString().slice(0, 10)].filter(Boolean).join('-') + '.csv';
}
