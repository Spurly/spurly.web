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

  it('shows who we are looking for and every candidate, and adds exactly the ticked ones', () => {
    const picks = [];
    renderWithProviders(
      <LookupReviewDrawer row={row} position={1} total={1} busy={false} onPick={(u) => picks.push(u)} onNone={() => {}} onSkip={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText('Looking for')).toBeTruthy();
    expect(screen.getByText('Which of these is Rahul?')).toBeTruthy();
    expect(screen.getByText('Similar title')).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Add to staged leads' }).disabled).toBe(true); // nothing ticked
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    fireEvent.click(screen.getAllByRole('checkbox')[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 to staged leads' }));
    expect(picks).toEqual([['https://www.linkedin.com/in/rahul-sharma-2', 'https://www.linkedin.com/in/rahul-sharma-3']]);
  });
});

describe('Import pipeline bar', () => {
  it('reads Finding → Sending to Hub → Found, with no review or send step', async () => {
    const { PipelineBar } = await import('src/products/pages/import/components/PipelineBar.jsx');
    const calls = [];
    renderWithProviders(
      <PipelineBar
        counts={{ finding: 3, notFound: 1, sending: 4, failed: 0, found: 5 }}
        view="finding"
        onSelect={(v) => calls.push(['select', v])}
        onOpenLeads={() => calls.push(['leads'])}
      />,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual([
      expect.stringMatching(/Finding on LinkedIn/),
      expect.stringMatching(/Sending to Hub/),
      expect.stringMatching(/Found by Spurly/),
    ]);
    expect(screen.queryByRole('button', { name: /Review/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '1 not found' }));
    fireEvent.click(screen.getByRole('button', { name: /Open Leads/ }));
    fireEvent.click(tabs[1]);
    expect(calls).toEqual([['select', 'notfound'], ['leads'], ['select', 'sending']]);
  });
});

describe('Match columns — live preview', () => {
  it('reads the file the way Spurly will and counts the outcome', async () => {
    const { FieldMappingPanel } = await import('src/products/pages/import/components/FieldMappingPanel.jsx');
    const a = analyzeCsv('First Name,Last Name,Company,LinkedIn URL\nAda,Lovelace,Analytical,linkedin.com/in/ada\nRahul,Sharma,TCS,\nNo,Company,,\n');
    renderWithProviders(
      <FieldMappingPanel headers={a.headers} sampleValues={a.sampleValues} rows={a.rows} mapping={a.mapping} onChange={() => {}} onReset={() => {}} />,
    );
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('Has LinkedIn URL')).toBeTruthy();
    expect(screen.getByText('Spurly will find')).toBeTruthy();
    expect(screen.getByText('straight to your Hub').previousSibling.textContent).toBe('1');
    expect(screen.getByText('Spurly will find on LinkedIn').previousSibling.textContent).toBe('1');
  });
});
