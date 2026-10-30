/**
 * Read every page of a server-paged list for a bulk export, fast and bounded.
 *
 * Page 1 tells us the total, then the remaining pages are fetched a few at a
 * time (`concurrency`), not one after another and not all at once, so a
 * 5,000-row export takes a handful of round trips without hammering the API.
 * Stops at `maxRows` (and says so), keeps page order, and drops a row seen
 * twice (a list that changed while it was being read). No try/catch here: a
 * failed page rejects and the calling controller reports it.
 *
 * fetchPage(page) -> Promise<{ rows: [], total: number }>
 * @returns {Promise<{ rows: any[], total: number, truncated: boolean }>}
 */
export async function fetchAllPages(fetchPage, { pageSize, maxRows, concurrency = 4, keyOf } = {}) {
  const first = await fetchPage(1);
  const total = Number.isFinite(first.total) ? first.total : first.rows.length;
  const pages = Math.ceil(Math.min(total, maxRows) / pageSize);

  const chunks = [first.rows];
  for (let start = 2; start <= pages; start += concurrency) {
    const batch = [];
    for (let page = start; page < start + concurrency && page <= pages; page += 1) batch.push(fetchPage(page));
    const results = await Promise.all(batch);
    chunks.push(...results.map((r) => r.rows));
  }

  let rows = chunks.flat();
  if (keyOf) {
    const seen = new Set();
    rows = rows.filter((row) => {
      const key = keyOf(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return { rows: rows.slice(0, maxRows), total, truncated: total > maxRows };
}
