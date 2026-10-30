import { describe, it, expect } from 'vitest';
import { buildDiscoverCsv, csvCell, exportDate, discoverExportFilename, EXPORT_COLUMNS } from 'src/products/discover/exportCsv.js';
import { searchPagesFor } from 'src/products/discover/format.js';

/** Discover CSV export: pure, synthetic rows of the server's shape. */

const parse = (csv) => csv.replace('﻿', '').trimEnd().split('\r\n');

describe('csvCell', () => {
  it('quotes commas, quotes and newlines, and keeps text on one cell', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\r\nline2')).toBe('"line1\nline2"');
  });
  it('defuses spreadsheet formulas in text, but leaves numbers alone', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('+91 98765')).toBe("'+91 98765");
    expect(csvCell('@handle')).toBe("'@handle");
    expect(csvCell(-5)).toBe('-5');
  });
  it('null, undefined and NaN are empty', () => {
    expect([csvCell(null), csvCell(undefined), csvCell(NaN)]).toEqual(['', '', '']);
  });
});

describe('exportDate', () => {
  it('is UTC to the minute, or empty', () => {
    expect(exportDate('2026-10-30T08:15:42.000Z')).toBe('2026-10-30 08:15');
    expect(exportDate('')).toBe('');
    expect(exportDate('nonsense')).toBe('');
  });
});

describe('buildDiscoverCsv', () => {
  it('nothing to export is an empty string, never a header-only file', () => {
    expect(buildDiscoverCsv('posts', [])).toBe('');
    expect(buildDiscoverCsv('nope', [{}])).toBe('');
  });

  it('starts with a BOM so Excel reads non-English text', () => {
    expect(buildDiscoverCsv('companies', [{ name: 'Café' }]).startsWith('﻿')).toBe(true);
  });

  it('companies: type, link fallback from slug, followers blank when unknown', () => {
    const rows = parse(buildDiscoverCsv('companies', [
      { companyId: '1', kind: 'company', slug: 'acme', name: 'Acme, Inc', industry: 'SaaS', location: 'Delhi', followersCount: 1200, summary: 'We build', profileUrl: '' },
      { companyId: '2', kind: 'school', slug: 'uni', name: 'Uni', followersCount: 0, profileUrl: 'https://www.linkedin.com/school/uni' },
    ]));
    expect(rows[0]).toBe('Company,Type,Industry,Location,Followers,About,LinkedIn URL,LinkedIn Company ID');
    expect(rows[1]).toBe('"Acme, Inc",Company,SaaS,Delhi,1200,We build,https://www.linkedin.com/company/acme,1');
    expect(rows[2]).toBe('Uni,School,,,,,https://www.linkedin.com/school/uni,2');
  });

  it('jobs: one flat row per job, company columns filled, none for a job without a company', () => {
    const rows = parse(buildDiscoverCsv('jobs', [
      { jobId: '7', title: 'React Dev', location: 'Remote', postedAt: '2026-10-29T10:00:00Z', url: 'https://www.linkedin.com/jobs/view/7', easyApply: true, promoted: false, reposted: false, company: { companyId: '9', name: 'Acme', slug: 'acme', profileUrl: '' } },
      { jobId: '8', title: 'Designer', company: null },
    ]));
    expect(rows[0].split(',')).toHaveLength(EXPORT_COLUMNS.jobs.length);
    expect(rows[1]).toBe('React Dev,Acme,Remote,2026-10-29 10:00,Yes,No,No,https://www.linkedin.com/jobs/view/7,https://www.linkedin.com/company/acme,7,9');
    expect(rows[2]).toBe('Designer,,,,No,No,No,,,8,');
  });

  it('posts: whole text (not a snippet), author link, hiring info, company-page author type', () => {
    const long = 'x'.repeat(500);
    const csv = buildDiscoverCsv('posts', [
      { socialId: 's1', text: long, postedAt: '2026-10-30T01:02:00Z', postedAgo: '5h', reactions: 10, comments: 2, reposts: 1, shareUrl: 'https://www.linkedin.com/posts/s1', isRepost: false,
        jobPosting: { title: 'Engineer' }, author: { providerId: 'ACoA1', publicIdentifier: 'jane', name: 'Jane', headline: 'CTO', isCompany: false } },
      { socialId: 's2', text: 'Hello\nworld', author: { providerId: 'ACoA2', publicIdentifier: 'brand', name: 'Brand', isCompany: true } },
    ]);
    expect(csv).toContain(long);
    expect(csv).toContain('Jane,Person,CTO,https://www.linkedin.com/in/jane,');
    expect(csv).toContain('Yes,Engineer');
    expect(csv).toContain('Brand,Company page,,https://www.linkedin.com/company/brand');
    expect(csv).toContain('"Hello\nworld"');
  });

  it('author link falls back to the member id when there is no public identifier', () => {
    expect(buildDiscoverCsv('posts', [{ author: { providerId: 'ACoAZ', name: 'N' } }])).toContain('https://www.linkedin.com/in/ACoAZ');
  });
});

describe('discoverExportFilename', () => {
  const day = new Date('2026-10-30T10:00:00Z');
  it('names the tab, the search and the day', () => {
    expect(discoverExportFilename('posts', { keywords: '#SmartLead: negative feedback!' }, day)).toBe('spurly-posts-smartlead-negative-feedback-2026-10-30.csv');
  });
  it('a pasted URL search is named search-url; no query still gives a valid name', () => {
    expect(discoverExportFilename('jobs', { url: 'https://www.linkedin.com/jobs/search/?x=1' }, day)).toBe('spurly-jobs-search-url-2026-10-30.csv');
    expect(discoverExportFilename('companies', null, day)).toBe('spurly-companies-2026-10-30.csv');
  });
});

describe('searchPagesFor', () => {
  it('rounds up by the tab\'s LinkedIn page size', () => {
    expect(searchPagesFor('companies', 25)).toBe(3);
    expect(searchPagesFor('companies', 100)).toBe(10);
    expect(searchPagesFor('posts', 100)).toBe(2);
    expect(searchPagesFor('jobs', 10)).toBe(1);
  });
});
