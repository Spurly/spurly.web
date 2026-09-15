/**
 * Client-side search + sort for a DataTable fed a page that's already fully
 * loaded in memory (a short, un-paginated list — campaigns, sequences,
 * enrichment runs). DataTable itself never touches `data`: it's
 * server-side oriented by design (see DataTable.jsx), so a caller with no
 * server to ask still needs to do this itself.
 *
 * Not for a server-paginated table — sorting only the current page would be
 * misleading when rows you can't see stay out of order.
 */

/** ISO 8601 timestamps compare correctly as plain strings, so no date-parsing
 *  special case is needed — this covers strings, numbers and null/undefined
 *  alike. */
export function sortRows(rows, sort, accessors = {}) {
  if (!sort?.key || !sort.direction) return rows;
  const { key, direction } = sort;
  const factor = direction === 'asc' ? 1 : -1;
  const get = accessors[key] || ((row) => row[key]);

  return [...rows].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * factor;
    if (av > bv) return factor;
    if (av < bv) return -factor;
    return 0;
  });
}

export function filterRows(rows, query, keys) {
  const q = query?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
}
