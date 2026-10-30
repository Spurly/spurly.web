import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from 'src/shared/utils/fetchAllPages.js';

/** Bulk-export page reader: page order, bounds, concurrency, duplicates, failures. */

const makeServer = (total, pageSize) => vi.fn(async (page) => {
  const start = (page - 1) * pageSize;
  const rows = Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, i) => ({ id: start + i + 1 }));
  return { rows, total };
});

describe('fetchAllPages', () => {
  it('reads every page in order', async () => {
    const fetchPage = makeServer(450, 200);
    const { rows, total, truncated } = await fetchAllPages(fetchPage, { pageSize: 200, maxRows: 10000 });
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(rows.map((r) => r.id)).toEqual(Array.from({ length: 450 }, (_, i) => i + 1));
    expect([total, truncated]).toEqual([450, false]);
  });

  it('one page of data is one request', async () => {
    const fetchPage = makeServer(30, 200);
    const { rows } = await fetchAllPages(fetchPage, { pageSize: 200, maxRows: 10000 });
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(30);
  });

  it('an empty list is empty, not an error', async () => {
    const { rows, total } = await fetchAllPages(makeServer(0, 200), { pageSize: 200, maxRows: 10000 });
    expect([rows.length, total]).toEqual([0, 0]);
  });

  it('stops at maxRows and says it was cut', async () => {
    const fetchPage = makeServer(1000, 100);
    const { rows, total, truncated } = await fetchAllPages(fetchPage, { pageSize: 100, maxRows: 250 });
    expect(rows).toHaveLength(250);
    expect([total, truncated]).toEqual([1000, true]);
    expect(fetchPage).toHaveBeenCalledTimes(3); // only the pages it needs
  });

  it('fetches a few pages at a time, never all at once', async () => {
    let inFlight = 0;
    let peak = 0;
    const fetchPage = async (page) => {
      inFlight += 1; peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return { rows: [{ id: page }], total: 20 };
    };
    await fetchAllPages(fetchPage, { pageSize: 1, maxRows: 100, concurrency: 4 });
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });

  it('drops a row that appears on two pages (the list changed while reading)', async () => {
    const pages = { 1: [{ id: 'a' }, { id: 'b' }], 2: [{ id: 'b' }, { id: 'c' }] };
    const { rows } = await fetchAllPages(async (p) => ({ rows: pages[p], total: 4 }), { pageSize: 2, maxRows: 100, keyOf: (r) => r.id });
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('a failed page rejects the whole export (no half file)', async () => {
    const fetchPage = async (page) => { if (page === 2) throw new Error('boom'); return { rows: [{ id: page }], total: 3 }; };
    await expect(fetchAllPages(fetchPage, { pageSize: 1, maxRows: 100 })).rejects.toThrow('boom');
  });
});
