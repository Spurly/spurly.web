/**
 * CSV import parsing + validation.
 *
 * Ported 1:1 from spurly.extension's ExploreTab CSV import (see
 * `src/pages/home/components/tabs/ExploreTab.jsx`) so the dashboard's "Import"
 * flow accepts exactly the same files, applies the same required-column rules,
 * and produces the same enrich-mode profile payloads the extension sends to
 * `POST /sessions/:id/profiles/batch`. If you change the rules here, mirror the
 * change in the extension (and vice versa) so the two stay identical.
 *
 * A CSV exported by either app (its `profileurl` + `Name` columns) is directly
 * re-importable — the required columns below match the export headers.
 */

/**
 * RFC 4180–style line splitter: respects double-quoted fields so embedded
 * commas (e.g. `"San Jose, California, United States"`) stay in one field and
 * `""` inside a quoted field decodes to a literal `"`. Newlines inside quoted
 * fields are not supported — parseCSV splits the text on `\n` first.
 */
export function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else if (c === '"' && cur === '') {
      inQuotes = true;
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

/**
 * Parse raw CSV text into { headers (lowercased), rows, originalHeaders }.
 * Strips a leading UTF-8 BOM so the first header isn't `﻿Name`.
 */
export function parseCSV(text) {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [], originalHeaders: [] };

  const originalHeaders = splitCsvLine(lines[0]);
  const headers = originalHeaders.map((h) => h.toLowerCase());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    rows.push(splitCsvLine(line));
  }

  return { headers, rows, originalHeaders };
}

/**
 * Columns a CSV must contain (exact, lowercase) to be importable. Both the
 * LinkedIn URL and a display name are mandatory before we save.
 */
export const REQUIRED_COLUMNS = ['profileurl', 'name'];

/**
 * Validate parsed CSV text and extract enrich-mode profile objects.
 *
 * Returns one of:
 *   { ok: false, error: { title, detail, columns? } }   — a dismissible, actionable error
 *   { ok: true, profiles: [...], skippedCount: number } — ready to save
 *
 * The four gates mirror the extension exactly:
 *   1. file has usable columns
 *   2. both required columns present
 *   3. at least one data row
 *   4. at least one row has both a profileurl and a name filled in
 */
export function validateAndExtractProfiles(csvText) {
  if (typeof csvText !== 'string') {
    return {
      ok: false,
      error: {
        title: "Couldn't read the file",
        detail: 'Make sure you selected a valid .csv file and try again.',
      },
    };
  }

  let parsed;
  try {
    parsed = parseCSV(csvText);
  } catch {
    return {
      ok: false,
      error: {
        title: "Couldn't parse the CSV",
        detail:
          'The file may be corrupted or not a valid CSV. Re-export it as a comma-separated .csv and try again.',
      },
    };
  }

  const { headers, rows, originalHeaders } = parsed;

  // Gate 1: the file must actually have columns.
  if (headers.length === 0 || (headers.length === 1 && !headers[0])) {
    return {
      ok: false,
      error: {
        title: 'This file appears to be empty',
        detail:
          "We couldn't read any columns. Export your list as a comma-separated .csv file and re-import.",
      },
    };
  }

  // Gate 2: required columns "profileurl" and "name" must both be present.
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingColumns.length > 0) {
    const missingList = missingColumns.map((c) => `"${c}"`).join(' and ');
    return {
      ok: false,
      error: {
        title:
          missingColumns.length === 1
            ? `No ${missingList} column found`
            : `Missing required columns: ${missingList}`,
        detail:
          'Your file must have both a "profileurl" and a "name" column (all lowercase, no spaces). Rename the matching columns and re-import.',
        columns: originalHeaders,
      },
    };
  }

  // Gate 3: header row is fine, but there are no data rows.
  if (rows.length === 0) {
    return {
      ok: false,
      error: {
        title: 'No data rows found',
        detail:
          'This file only has a header row. Add at least one profile and re-import.',
      },
    };
  }

  const profileUrlIndex = headers.findIndex((h) => h === 'profileurl');
  const nameIndex = headers.findIndex((h) => h === 'name');
  // Optional passthrough columns — imported when present so a CSV exported from
  // Spurly round-trips its extra data instead of losing it.
  const idx = (name) => headers.findIndex((h) => h === name);
  const titleIndex = idx('title');
  const companyIndex = idx('company');
  const locationIndex = idx('location');
  const headlineIndex = idx('headline');
  const emailIndex = idx('email');
  const phoneIndex = idx('phone');

  let skippedCount = 0;
  const profiles = rows
    .map((row, i) => {
      const profileUrl = row[profileUrlIndex]?.trim();
      const name = row[nameIndex]?.trim();
      // Both profileurl and name are mandatory — skip rows missing either so we
      // never send a blank-name profile to the backend.
      if (!profileUrl || !name) {
        skippedCount++;
        return null;
      }

      const cell = (index) => (index >= 0 ? row[index]?.trim() || '' : '');

      return {
        profileUrl,
        name,
        title: cell(titleIndex),
        company: cell(companyIndex),
        location: cell(locationIndex),
        headline: cell(headlineIndex),
        email: cell(emailIndex),
        phone: cell(phoneIndex),
        about: '',
        connectionCount: 0,
        education: [],
        experiences: [],
        skills: [],
        languages: [],
        website: '',
        _origin: 'enrichment',
        _id: `enriched_${Date.now()}_${i}`,
      };
    })
    .filter(Boolean);

  // Gate 4: columns exist but no row had BOTH a profileurl and a name filled in.
  if (profiles.length === 0) {
    return {
      ok: false,
      error: {
        title: 'No valid rows to import',
        detail: `None of the ${rows.length} row${
          rows.length === 1 ? '' : 's'
        } had both a "profileurl" and a "name" filled in. Complete those two columns and re-import.`,
      },
    };
  }

  return { ok: true, profiles, skippedCount };
}
