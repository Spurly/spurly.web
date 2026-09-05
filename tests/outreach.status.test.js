import { describe, it, expect } from 'vitest';
import {
  OUTREACH_STATUS_META, OUTREACH_FILTERS, getOutreach, isContacted,
} from 'src/shared/utils/outreach.js';

describe('outreach status model', () => {
  // These five must stay in step with the backend enum
  // (platform-side: none/invited/connected/messaged/failed). A silent drift
  // here renders a blank pill rather than throwing, which is why it's pinned.
  it('covers exactly the five backend statuses', () => {
    expect(Object.keys(OUTREACH_STATUS_META).sort())
      .toEqual(['connected', 'failed', 'invited', 'messaged', 'none']);
  });

  it('deliberately omits a "failed" filter chip', () => {
    // A permanent "0" chip is noise on a healthy account; failures surface as a
    // conditional alert instead. Server-side filtering by failed still works.
    expect(OUTREACH_FILTERS.map((f) => f.id)).not.toContain('failed');
  });

  it('reads the rollup off both a Profile entity and a raw row', () => {
    expect(getOutreach({ outreach: { status: 'invited' } })).toEqual({ status: 'invited' });
    expect(getOutreach({ raw: { outreach: { status: 'messaged' } } })).toEqual({ status: 'messaged' });
    expect(getOutreach(null)).toBeNull();
  });

  it('treats contacted as "has been touched", not as any particular status', () => {
    expect(isContacted({ outreach: { lastTouchedAt: '2026-09-01' } })).toBe(true);
    expect(isContacted({ outreach: { status: 'none' } })).toBe(false);
    expect(isContacted({})).toBe(false);
  });
});
