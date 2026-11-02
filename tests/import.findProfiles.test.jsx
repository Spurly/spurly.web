import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { analyzeCsv, extractProfiles, validateMapping, UNMAPPED } from 'src/shared/utils/csvImport.js';
import { LookupReviewDrawer } from 'src/products/pages/import/components/LookupReviewDrawer.jsx';
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

describe('Find profiles — review drawer', () => {
  const candidates = [1, 2, 3].map((i) => ({
    profileUrl: `https://www.linkedin.com/in/rahul-sharma-${i}`,
    name: 'Rahul Sharma',
    headline: `Engineer ${i} at TCS`,
    location: 'Pune',
    reasons: i === 2 ? ['title'] : [],
  }));
  const row = { _id: 'l1', status: 'needs_review', input: { name: 'Rahul Sharma', company: 'TCS', title: 'Engineer' }, candidates };

  it('shows the file facts and every candidate, and adds only the selected one', () => {
    const picks = [];
    renderWithProviders(
      <LookupReviewDrawer row={row} position={1} total={1} busy={false} onPick={(u) => picks.push(u)} onNone={() => {}} onSkip={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText('Your file says')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    const add = screen.getByRole('button', { name: 'Add to staged leads' });
    expect(add.disabled).toBe(true); // nothing selected → nothing can be added
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(add);
    expect(picks).toEqual(['https://www.linkedin.com/in/rahul-sharma-2']);
  });
});
