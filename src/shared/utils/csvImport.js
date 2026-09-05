/**
 * CSV import parsing, field mapping and validation.
 *
 * Originally a 1:1 port of spurly.extension's ExploreTab CSV import, which
 * required columns named exactly `profileurl` and `name`. That made any file
 * exported from another tool ("LinkedIn URL", "Full Name", "Person Linkedin
 * Url") a hard error the user could only fix by editing the CSV by hand.
 *
 * The rules now live in two layers:
 *
 *   1. `analyzeCsv(text)` parses the file and AUTO-DETECTS which column feeds
 *      which Spurly field, using the alias table in IMPORT_FIELDS.
 *   2. The user confirms or corrects that mapping in the UI, and
 *      `extractProfiles(rows, mapping)` turns rows into stageable profiles.
 *
 * A missing column is therefore no longer an error — it is an unmapped field
 * the user can point at the right header. Only `profileUrl` plus some form of
 * name (either a full-name column, or a first-name column) are mandatory.
 *
 * A CSV exported by Spurly still round-trips: its `profileurl` / `Name`
 * headers are the first alias of each field, so auto-detection maps it with
 * nothing for the user to do.
 */

/**
 * RFC 4180–style line splitter: respects double-quoted fields so embedded
 * commas (e.g. `"San Jose, California, United States"`) stay in one field and
 * `""` inside a quoted field decodes to a literal `"`.
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
 * Split raw CSV text into logical lines, keeping newlines that sit INSIDE a
 * quoted field attached to their record.
 *
 * The old splitter did a plain `text.split(/\r?\n/)`, which tore a multi-line
 * "About"/"Notes" cell — common in exports from Apollo, HubSpot and Sales
 * Navigator — into several broken rows and silently corrupted every column
 * after it. Quote state is tracked across the whole file so those records stay
 * whole; `splitCsvLine` then handles the field-level parsing as before.
 */
function splitCsvRecords(text) {
  const records = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      // A doubled quote inside a quoted field is an escaped quote, not the end
      // of the field — consume both so quote state stays correct.
      if (inQuotes && text[i + 1] === '"') {
        cur += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      cur += c;
      continue;
    }
    if (!inQuotes && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      records.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  records.push(cur);
  return records;
}

/**
 * Parse raw CSV text into { headers (lowercased), rows, originalHeaders }.
 * Strips a leading UTF-8 BOM so the first header isn't `<BOM>Name`.
 */
export function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = splitCsvRecords(clean);
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
 * The Spurly fields a CSV column can be mapped onto, in the order the mapping
 * UI shows them.
 *
 * `aliases` are compared against NORMALIZED headers (lowercased, every
 * non-alphanumeric character stripped) so "LinkedIn URL", "linkedin_url" and
 * "Linkedin-Url" all collapse to `linkedinurl` and match one entry.
 *
 * Every key here is accepted by the backend's staging whitelist
 * (spurly.backend `importedLeads/service.js` → STAGEABLE_FIELDS). Adding a
 * field here without adding it there means the column is mapped in the UI and
 * then silently dropped on save — keep the two lists in step.
 */
export const IMPORT_FIELDS = [
  {
    key: 'profileUrl',
    label: 'LinkedIn URL',
    required: true,
    hint: 'The profile we visit when enriching. Required.',
    aliases: [
      'profileurl', 'profilelink', 'linkedinurl', 'linkedinprofileurl', 'linkedinprofile',
      'personlinkedinurl', 'linkedinlink', 'linkedin', 'publicprofileurl', 'profile', 'url',
      'link', 'lipprofileurl', 'linkedincontactprofileurl', 'memberprofileurl',
    ],
  },
  {
    key: 'name',
    label: 'Full name',
    requiredGroup: 'name',
    hint: 'Or map First name instead.',
    aliases: ['name', 'fullname', 'contactname', 'personname', 'leadname', 'displayname', 'candidatename'],
  },
  {
    key: 'firstName',
    label: 'First name',
    requiredGroup: 'name',
    aliases: ['firstname', 'givenname', 'forename', 'fname'],
  },
  {
    key: 'lastName',
    label: 'Last name',
    aliases: ['lastname', 'surname', 'familyname', 'lname'],
  },
  {
    key: 'title',
    label: 'Job title',
    aliases: ['title', 'jobtitle', 'position', 'role', 'currenttitle', 'currentposition', 'designation'],
  },
  {
    key: 'company',
    label: 'Company',
    aliases: ['company', 'companyname', 'organization', 'organisation', 'employer', 'currentcompany', 'account', 'accountname'],
  },
  {
    key: 'location',
    label: 'Location',
    aliases: ['location', 'city', 'region', 'geography', 'country', 'address', 'locationname', 'personlocation'],
  },
  {
    key: 'headline',
    label: 'Headline',
    aliases: ['headline', 'linkedinheadline', 'summary', 'tagline', 'bio'],
  },
  {
    key: 'email',
    label: 'Email',
    aliases: ['email', 'emailaddress', 'workemail', 'businessemail', 'primaryemail', 'contactemail', 'mail'],
  },
  {
    key: 'phone',
    label: 'Phone',
    aliases: ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'telephone', 'tel', 'workphone', 'contactnumber'],
  },
  {
    key: 'website',
    label: 'Website',
    aliases: ['website', 'websiteurl', 'companywebsite', 'companyurl', 'domain', 'homepage', 'site'],
  },
];

/** Fast lookup of a field definition by key. */
export const IMPORT_FIELD_BY_KEY = Object.freeze(
  Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, f])),
);

/** Every mappable field key, in UI order. */
export const IMPORT_FIELD_KEYS = IMPORT_FIELDS.map((f) => f.key);

/**
 * Columns a CSV must contain to be importable.
 *
 * Kept as a named export because the old error copy referenced it; the mapping
 * step means these are now *field* requirements, not literal header names.
 */
export const REQUIRED_COLUMNS = ['profileurl', 'name'];

/** Sentinel used by the mapping UI for "this field has no column". */
export const UNMAPPED = -1;

/**
 * Rows the staging endpoint accepts in one call — mirrors MAX_STAGE_BATCH in
 * spurly.backend's importedLeads/service.js. Checked before the request so a
 * big file is caught while the user still has the mapping in front of them,
 * rather than after an upload that ends in a 400.
 */
export const MAX_IMPORT_ROWS = 1000;

/** Lowercase and strip everything that isn't a letter or digit. */
function normalizeHeader(header) {
  return String(header || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Guess a column index for every field from the file's headers.
 *
 * Two passes, so an exact alias always beats a fuzzy one: a file with both
 * "Company" and "Company Website" must not hand "Company Website" to `company`
 * just because it was the first header containing the word.
 *
 * A column is only ever assigned to ONE field — a header already claimed by an
 * earlier (higher-priority) field is skipped, which is why IMPORT_FIELDS is
 * ordered with the most specific fields first.
 *
 * @param {string[]} headers  Header cells, in file order (any casing).
 * @returns {Record<string, number>} field key → column index (UNMAPPED if none)
 */
export function autoDetectMapping(headers = []) {
  const normalized = headers.map(normalizeHeader);
  const mapping = {};
  const claimed = new Set();

  for (const field of IMPORT_FIELDS) mapping[field.key] = UNMAPPED;

  // Pass 1 — exact alias match.
  for (const field of IMPORT_FIELDS) {
    const aliases = new Set(field.aliases);
    const index = normalized.findIndex((h, i) => h && !claimed.has(i) && aliases.has(h));
    if (index >= 0) {
      mapping[field.key] = index;
      claimed.add(index);
    }
  }

  // Pass 2 — "contains an alias" for fields still unmapped. Aliases shorter
  // than 4 characters ("url", "tel", "mail") are excluded here: they match far
  // too much as substrings ("mail" is inside "emailaddress").
  for (const field of IMPORT_FIELDS) {
    if (mapping[field.key] !== UNMAPPED) continue;
    const aliases = field.aliases.filter((a) => a.length >= 4);
    if (aliases.length === 0) continue;
    const index = normalized.findIndex(
      (h, i) => h && !claimed.has(i) && aliases.some((a) => h.includes(a)),
    );
    if (index >= 0) {
      mapping[field.key] = index;
      claimed.add(index);
    }
  }

  return mapping;
}

/**
 * Coerce anything (a saved mapping from localStorage, a user edit) into a
 * complete, in-range mapping object. Unknown keys are dropped and out-of-range
 * indexes become UNMAPPED, so a stale saved mapping can never index past the
 * end of a row.
 */
export function normalizeMapping(mapping, columnCount) {
  const out = {};
  for (const field of IMPORT_FIELDS) {
    const raw = mapping?.[field.key];
    const index = Number.isInteger(raw) ? raw : parseInt(raw, 10);
    out[field.key] =
      Number.isInteger(index) && index >= 0 && index < columnCount ? index : UNMAPPED;
  }
  return out;
}

/**
 * What's still missing before a mapping can be imported.
 *
 * @returns {{ ok: boolean, missing: string[] }} missing = human labels
 */
export function validateMapping(mapping) {
  const missing = [];
  if (!mapping || mapping.profileUrl === undefined || mapping.profileUrl === UNMAPPED) {
    missing.push('LinkedIn URL');
  }
  const hasName = mapping?.name >= 0 || mapping?.firstName >= 0;
  if (!hasName) missing.push('Full name (or First name)');
  return { ok: missing.length === 0, missing };
}

/**
 * Mirrors spurly.backend's LINKEDIN_URL_REGEX. A row whose URL fails this is
 * rejected by the staging endpoint, so we check it here too and tell the user
 * up front instead of reporting "imported 200" when only 40 landed.
 */
const LINKEDIN_URL_REGEX =
  /^https:\/\/www\.linkedin\.com\/(in\/[a-z0-9-]+|sales\/lead\/[A-Za-z0-9_-]+)/i;

/**
 * Repair the URL shapes real CSVs contain, then validate.
 *
 * Files exported from other tools routinely carry `linkedin.com/in/ada`,
 * `http://linkedin.com/in/ada`, a `?originalSubdomain=in` query, a trailing
 * slash, or a regional `in.linkedin.com` host — all of which the backend's
 * regex rejects verbatim. Normalizing here means those rows import instead of
 * being silently skipped server-side.
 *
 * @returns {string|null} canonical URL, or null when it isn't a LinkedIn profile.
 */
export function normalizeLinkedInUrl(raw) {
  let value = String(raw ?? '').trim();
  if (!value) return null;

  // Excel's "=HYPERLINK(...)" and stray wrapping quotes.
  value = value.replace(/^["'\s]+|["'\s]+$/g, '');
  if (!value) return null;

  value = value.replace(/^https?:\/\//i, '');
  // Regional and mobile hosts are the same profile: xx.linkedin.com, m.linkedin.com.
  value = value.replace(/^[a-z0-9-]+\.linkedin\.com/i, 'linkedin.com');
  value = value.replace(/^www\.linkedin\.com/i, 'linkedin.com');
  if (!/^linkedin\.com\//i.test(value)) return null;

  // Drop query string, fragment and any trailing slash.
  let path = value.slice('linkedin.com'.length).split(/[?#]/)[0].replace(/\/+$/, '');
  if (!path) return null;

  // `/in/` slugs are canonically lowercase, and profileUrl is the dedupe key
  // against rows already in People — a mixed-case paste must not become a
  // second copy of the same person. Sales Navigator lead ids ARE
  // case-sensitive, so only the /in/ form is folded.
  if (/^\/in\//i.test(path)) path = path.toLowerCase();

  const url = `https://www.linkedin.com${path}`;
  return LINKEDIN_URL_REGEX.test(url) ? url : null;
}

/**
 * Turn parsed rows into enrich-mode profile objects using a confirmed mapping.
 *
 * Rows are skipped (never silently mangled) when they lack a usable LinkedIn
 * URL or a name, and the two reasons are counted separately so the UI can say
 * which one to fix.
 *
 * @param {string[][]} rows
 * @param {Record<string, number>} mapping
 * @returns {{ profiles: object[], skippedCount: number, skippedNoUrl: number,
 *             skippedBadUrl: number, skippedNoName: number }}
 */
export function extractProfiles(rows = [], mapping = {}) {
  const cellAt = (row, index) => (index >= 0 ? String(row[index] ?? '').trim() : '');

  let skippedNoUrl = 0;
  let skippedBadUrl = 0;
  let skippedNoName = 0;
  const seenUrls = new Set();

  const profiles = [];
  rows.forEach((row, i) => {
    const rawUrl = cellAt(row, mapping.profileUrl ?? UNMAPPED);
    if (!rawUrl) {
      skippedNoUrl++;
      return;
    }
    const profileUrl = normalizeLinkedInUrl(rawUrl);
    if (!profileUrl) {
      skippedBadUrl++;
      return;
    }

    const firstName = cellAt(row, mapping.firstName ?? UNMAPPED);
    const lastName = cellAt(row, mapping.lastName ?? UNMAPPED);
    // A mapped full-name column wins; otherwise compose one from the parts, so
    // the very common first/last export shape imports without hand-editing.
    const name = cellAt(row, mapping.name ?? UNMAPPED) || [firstName, lastName].filter(Boolean).join(' ');
    if (!name) {
      skippedNoName++;
      return;
    }

    // Same file, same person twice: keep the first row. The backend collapses
    // duplicates too (last row wins there), but counting them here keeps the
    // "ready to stage" number honest.
    if (seenUrls.has(profileUrl)) return;
    seenUrls.add(profileUrl);

    profiles.push({
      profileUrl,
      name,
      firstName,
      lastName,
      title: cellAt(row, mapping.title ?? UNMAPPED),
      company: cellAt(row, mapping.company ?? UNMAPPED),
      location: cellAt(row, mapping.location ?? UNMAPPED),
      headline: cellAt(row, mapping.headline ?? UNMAPPED),
      email: cellAt(row, mapping.email ?? UNMAPPED),
      phone: cellAt(row, mapping.phone ?? UNMAPPED),
      website: cellAt(row, mapping.website ?? UNMAPPED),
      about: '',
      connectionCount: 0,
      education: [],
      experiences: [],
      skills: [],
      languages: [],
      _origin: 'enrichment',
      _id: `enriched_${Date.now()}_${i}`,
    });
  });

  return {
    profiles,
    skippedNoUrl,
    skippedBadUrl,
    skippedNoName,
    skippedCount: skippedNoUrl + skippedBadUrl + skippedNoName,
  };
}

/**
 * Parse a file and prepare it for the mapping step.
 *
 * Only genuinely unusable files are errors here — no columns, or no data rows.
 * "The column isn't called profileurl" is not one of them any more: that's what
 * the mapping UI is for.
 *
 * @returns {{ ok: false, error: { title, detail, columns? } }
 *          | { ok: true, headers, rows, mapping, sampleValues }}
 */
export function analyzeCsv(csvText) {
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

  if (rows.length === 0) {
    return {
      ok: false,
      error: {
        title: 'No data rows found',
        detail: 'This file only has a header row. Add at least one profile and re-import.',
      },
    };
  }

  // First non-empty value per column, shown under each dropdown so the user can
  // confirm a mapping by looking at real data rather than trusting the header.
  const sampleValues = originalHeaders.map((_, col) => {
    for (const row of rows) {
      const value = String(row[col] ?? '').trim();
      if (value) return value;
    }
    return '';
  });

  return {
    ok: true,
    headers: originalHeaders,
    rows,
    mapping: autoDetectMapping(originalHeaders),
    sampleValues,
  };
}

/**
 * One-shot parse + auto-map + extract, with no user confirmation step.
 *
 * Retained for callers that just want the old behaviour (and as the shape the
 * extension's inline copy still mirrors). The UI uses `analyzeCsv` +
 * `extractProfiles` instead so the mapping can be corrected first.
 */
export function validateAndExtractProfiles(csvText) {
  const analysis = analyzeCsv(csvText);
  if (!analysis.ok) return analysis;

  const check = validateMapping(analysis.mapping);
  if (!check.ok) {
    return {
      ok: false,
      error: {
        title: `Couldn't match ${check.missing.length === 1 ? 'a required column' : 'the required columns'}`,
        detail: `We couldn't find a column for ${check.missing.join(' and ')}. Map your columns and re-import.`,
        columns: analysis.headers,
      },
    };
  }

  const extracted = extractProfiles(analysis.rows, analysis.mapping);
  if (extracted.profiles.length === 0) {
    return {
      ok: false,
      error: {
        title: 'No valid rows to import',
        detail: `None of the ${analysis.rows.length} row${
          analysis.rows.length === 1 ? '' : 's'
        } had both a usable LinkedIn URL and a name.`,
      },
    };
  }

  return { ok: true, ...extracted };
}
