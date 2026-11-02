import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { analyzeCsv, extractProfiles, validateMapping, UNMAPPED } from 'src/shared/utils/csvImport.js';
import { LookupPanel } from 'src/products/pages/import/components/LookupPanel.jsx';
import { renderWithProviders } from './helpers.jsx';

/**
 * "Find LinkedIn URL" on the Import page: a file with names + companies but
 * no URLs must be importable, and an ambiguous lookup must show every
 * candidate and add only the one the user picks.
 */

describe('csvImport — rows without a LinkedIn URL', () => {
  it('a name + company file is valid with no URL column at all', () => {
    const a = analyzeCsv('First Name,Last Name,Company\nSarthak,Vats,Thoughts2Binary\nRahul,Sharma,TCS\n');
    expect(a.ok).toBe(true);
    expect(a.mapping.profileUrl).toBe(UNMAPPED);
    expect(validateMapping(a.mapping)).toMatchObject({ ok: true, canFindProfiles: true });

    const out = extractProfiles(a.rows, a.mapping);
    expect(out.profiles).toHaveLength(0);
    expect(out.lookupRows.map((r) => r.name)).toEqual(['Sarthak Vats', 'Rahul Sharma']);
    expect(out.lookupRows[0]).toMatchObject({ company: 'Thoughts2Binary', profileUrl: '' });
  });

  it('a mixed file stages URL rows and looks up the rest; no company means skipped', () => {
    const csv = [
      'Name,LinkedIn URL,Company',
      'Ada Lovelace,linkedin.com/in/ada,Analytical',
      'Rahul Sharma,,TCS',
      'Rahul Sharma,,tcs',
      'No Company,,',
    ].join('\n');
    const a = analyzeCsv(csv);
    const out = extractProfiles(a.rows, a.mapping);
    expect(out.profiles.map((p) => p.profileUrl)).toEqual(['https://www.linkedin.com/in/ada']);
    expect(out.lookupRows).toHaveLength(1);
    expect(out.skippedNoUrl).toBe(1);
  });

  it('neither URL nor company → still asks for one of them', () => {
    const a = analyzeCsv('Name,Title\nAda,Engineer\n');
    expect(validateMapping(a.mapping)).toMatchObject({ ok: false, missing: ['LinkedIn URL (or Company)'] });
  });
});

describe('LookupPanel — needs review', () => {
  const candidates = [1, 2, 3].map((i) => ({
    profileUrl: `https://www.linkedin.com/in/rahul-sharma-${i}`,
    name: 'Rahul Sharma',
    headline: `Engineer ${i} at TCS`,
    location: 'Pune',
    reasons: i === 2 ? ['title'] : [],
  }));
  const picks = [];
  const store = {
    view: 'needs_review',
    setView: () => {},
    rows: [{ _id: 'l1', status: 'needs_review', input: { name: 'Rahul Sharma', company: 'TCS' }, candidates }],
    stats: { inFlight: 0, needsReview: 1, notFound: 0, found: 0 },
    pagination: { total: 1 },
    page: 1,
    setPage: () => {},
    loading: false,
    error: null,
    actionError: null,
    clearActionError: () => {},
    pendingId: null,
    busy: false,
    refresh: () => {},
    pick: (id, url) => picks.push([id, url]),
    dismiss: () => {},
    dismissAll: () => {},
    retry: () => {},
  };

  it('shows every candidate and picks exactly the one clicked', () => {
    renderWithProviders(<LookupPanel store={store} onGoToStaged={() => {}} />);
    expect(screen.getByText('3 possible matches')).toBeTruthy();
    expect(screen.getAllByText('Rahul Sharma')).toHaveLength(3);
    fireEvent.click(screen.getAllByRole('button', { name: 'This one' })[1]);
    expect(picks).toEqual([['l1', 'https://www.linkedin.com/in/rahul-sharma-2']]);
    expect(screen.getByRole('button', { name: /None of these/ })).toBeTruthy();
  });
});
