import { describe, it, expect } from 'vitest';
import { buildLeadsCsv, leadsExportFilename, LEAD_EXPORT_COLUMNS } from 'src/products/leads/exportCsv.js';
import { buildViewersCsv, viewersExportFilename, VIEWER_EXPORT_COLUMNS } from 'src/products/profileViewers/exportCsv.js';
import { buildCsvTable, csvFilename } from 'src/shared/utils/csvTable.js';

/** Leads and Profile viewers CSV export: pure, synthetic rows of the server's shape. */

const parse = (csv) => csv.replace('﻿', '').trimEnd().split('\r\n');

describe('buildCsvTable', () => {
  it('nothing to export is an empty string', () => {
    expect(buildCsvTable([['A', (x) => x.a]], [])).toBe('');
  });
  it('csvFilename leaves out empty parts', () => {
    expect(csvFilename(['leads', '', undefined], new Date('2026-10-30T10:00:00Z'))).toBe('spurly-leads-2026-10-30.csv');
  });
});

describe('buildLeadsCsv', () => {
  const lead = (over = {}) => ({
    _id: '1', name: 'Jane Doe', headline: 'Head of Sales, Acme', currentTitle: 'Head of Sales', companyName: 'Acme',
    location: 'Delhi', connectionDegree: 2, followersCount: 3000, isPremium: true, enrichmentStatus: 'enriched',
    createdAt: '2026-10-01T08:00:00Z', pendingInvitationSentAt: '2026-10-02T09:30:00Z', connectedAt: null, lastMessageSentAt: null,
    profileUrl: 'https://www.linkedin.com/in/jane', ...over,
  });

  it('has a readable header and one row per lead, with real dates and the link', () => {
    const rows = parse(buildLeadsCsv([lead()]));
    expect(rows[0].split(',')).toHaveLength(LEAD_EXPORT_COLUMNS.length);
    expect(rows[1]).toBe('Jane Doe,Head of Sales,Acme,Delhi,"Head of Sales, Acme",2nd,Invited,2026-10-02 09:30,,,2026-10-01 08:00,Enriched,3000,Yes,https://www.linkedin.com/in/jane');
  });

  it('status follows the table rule: 1st degree is Connected, an invite out is Invited, else New', () => {
    const status = (over) => parse(buildLeadsCsv([lead({ headline: 'Sales', pendingInvitationSentAt: null, ...over })]))[1].split(',')[6];
    expect(status({ connectionDegree: 1 })).toBe('Connected');
    expect(status({ connectionDegree: 3, pendingInvitationSentAt: '2026-10-02T09:30:00Z' })).toBe('Invited');
    expect(status({ connectionDegree: 3 })).toBe('New');
  });

  it('unresolved fields are blank, not "undefined" or 0', () => {
    const row = parse(buildLeadsCsv([{ name: 'No Info' }]))[1];
    expect(row).toBe('No Info,,,,,,New,,,,,,,,');
  });

  it('text starting with a formula character is defused', () => {
    expect(buildLeadsCsv([lead({ headline: '=1+1' })])).toContain("'=1+1");
  });

  it('names the file after the open audience', () => {
    const day = new Date('2026-10-30T10:00:00Z');
    expect(leadsExportFilename('React Founders (US)', day)).toBe('spurly-leads-react-founders-us-2026-10-30.csv');
    expect(leadsExportFilename(undefined, day)).toBe('spurly-leads-2026-10-30.csv');
  });
});

describe('buildViewersCsv', () => {
  const viewer = (over = {}) => ({
    providerId: 'ACoA1', fullName: 'Sam Roe', headline: 'Founder', connectionDegree: 3, profileUrl: 'https://www.linkedin.com/in/sam',
    firstSeenAt: '2026-10-20T10:00:00Z', lastViewedAt: '2026-10-29T05:00:00Z', lastViewedPrecision: 'day', viewsSeen: 2, ...over,
  });

  it('says the last-viewed time is approximate and gives its precision', () => {
    const rows = parse(buildViewersCsv([viewer()]));
    expect(rows[0]).toBe('Name,Headline,Connection,Last viewed (approx. UTC),Precision,First seen (UTC),Times seen,LinkedIn URL,LinkedIn ID');
    expect(rows[1]).toBe('Sam Roe,Founder,3rd,2026-10-29 05:00,day,2026-10-20 10:00,2,https://www.linkedin.com/in/sam,ACoA1');
    expect(rows[0].split(',').length).toBeGreaterThanOrEqual(VIEWER_EXPORT_COLUMNS.length);
  });

  it('a 4th-degree-or-beyond viewer is still "3rd" (the app groups 3rd and beyond)', () => {
    expect(parse(buildViewersCsv([viewer({ connectionDegree: 4 })]))[1].split(',')[2]).toBe('3rd');
  });

  it('a viewer with no degree has a blank connection', () => {
    expect(parse(buildViewersCsv([viewer({ connectionDegree: null })]))[1].split(',')[2]).toBe('');
  });

  it('names the file after the connection level when one is chosen', () => {
    const day = new Date('2026-10-30T10:00:00Z');
    expect(viewersExportFilename('2nd', day)).toBe('spurly-profile-viewers-2nd-2026-10-30.csv');
    expect(viewersExportFilename('', day)).toBe('spurly-profile-viewers-2026-10-30.csv');
  });
});
