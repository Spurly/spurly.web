import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { renderWithProviders } from './helpers.jsx';

/**
 * One flat nav tree, no lock.
 *
 * This used to be two groups (Extension Driven / Automated) with the second
 * shown-but-locked behind an entitlement check, which is what the previous
 * version of this file pinned. The two-tier leadgen/hub split was removed
 * 2026-09-14 — every active subscriber now has full access to every row —
 * so there is one thing left worth pinning: every row renders, and every
 * row goes to its own destination when clicked.
 */

function LocationSpy({ into }) {
  const { pathname } = useLocation();
  if (into[into.length - 1] !== pathname) into.push(pathname);
  return null;
}

function renderLayout(visited = []) {
  const utils = renderWithProviders(
    <>
      <LocationSpy into={visited} />
      <DashboardLayout title="Test">content</DashboardLayout>
    </>,
    { route: '/dashboard/import' },
  );
  return { ...utils, visited };
}

describe('DashboardLayout — sidebar', () => {
  it('renders every section and row together, no switcher and no lock', () => {
    renderLayout();
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Prospect')).toBeTruthy();
    expect(within(nav).getByText('Engage')).toBeTruthy();
    expect(within(nav).getByText('Manage')).toBeTruthy();
    expect(within(nav).getByText('Import')).toBeTruthy();
    expect(within(nav).getByText('Leads')).toBeTruthy();
    expect(within(nav).getByText('Sequences')).toBeTruthy();
    expect(within(nav).getByText('Inbox')).toBeTruthy();
  });

  it('a row always routes to its own destination', async () => {
    const user = userEvent.setup();
    const visited = [];
    renderLayout(visited);

    await user.click(screen.getByText('Leads'));

    expect(visited[visited.length - 1]).toBe('/hub/leads');
  });
});
