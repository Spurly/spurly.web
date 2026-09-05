import { IMPORT_FIELDS, UNMAPPED, normalizeMapping } from 'src/shared/utils/csvImport.js';

/**
 * Remembers the last CSV column mapping the user confirmed.
 *
 * Stored by HEADER NAME, never by column index: the same export from a
 * different day can have an extra column in the middle, and a remembered index
 * would then quietly point at the wrong data. Names survive that.
 *
 * localStorage only — a mapping is a per-browser convenience, not account
 * state, and every access is guarded because storage throws outright in
 * private-mode and blocked-cookie contexts.
 */
const STORAGE_KEY = 'spurly.enrich.csvMapping.v1';

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.headers) || !parsed.mapping || typeof parsed.mapping !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Persist a confirmed mapping as field → header name (null = not imported). */
export function saveMapping(headers, mapping) {
  try {
    const byName = {};
    for (const field of IMPORT_FIELDS) {
      const index = mapping?.[field.key];
      byName[field.key] =
        Number.isInteger(index) && index >= 0 && index < headers.length ? headers[index] : null;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ headers, mapping: byName, savedAt: Date.now() }),
    );
  } catch {
    /* Storage unavailable (private mode, blocked cookies). Remembering the
       mapping is a nicety — never let it break an import. */
  }
}

/**
 * Overlay the remembered mapping onto a freshly auto-detected one.
 *
 * Two cases, deliberately different:
 *   • Same header set as last time → the user's saved choices win outright,
 *     including their decision to leave a field out. This is the "I import the
 *     same export every week" case, and re-detection must not undo an
 *     override they already made.
 *   • Different file → only fields whose saved column still exists are
 *     applied. Auto-detection keeps the rest, so a new file is never left
 *     worse off than with no memory at all.
 *
 * @returns {Record<string, number>} a complete mapping
 */
export function applyRememberedMapping(headers, detected) {
  const saved = readStore();
  if (!saved) return detected;

  const indexOfHeader = new Map();
  headers.forEach((header, i) => {
    const key = String(header ?? '').trim().toLowerCase();
    // First occurrence wins, matching how auto-detection scans left to right.
    if (key && !indexOfHeader.has(key)) indexOfHeader.set(key, i);
  });

  const sameFile =
    saved.headers.length === headers.length &&
    saved.headers.every((h, i) => String(h ?? '') === String(headers[i] ?? ''));

  const next = { ...detected };
  for (const field of IMPORT_FIELDS) {
    const savedHeader = saved.mapping[field.key];
    if (savedHeader === null || savedHeader === undefined) {
      if (sameFile) next[field.key] = UNMAPPED;
      continue;
    }
    const index = indexOfHeader.get(String(savedHeader).trim().toLowerCase());
    if (index !== undefined) next[field.key] = index;
    else if (sameFile) next[field.key] = UNMAPPED;
  }

  return normalizeMapping(next, headers.length);
}
