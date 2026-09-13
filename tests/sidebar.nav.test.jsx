import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { SubscriptionContext } from 'src/platform/billing/hooks/SubscriptionContext';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { renderWithProviders } from './helpers.jsx';

/**
 * The grouped sidebar replaced a workspace switcher that swapped the whole
 * nav tree between Capture and Hub. Three things worth pinning, because the
 * switcher already got one of them wrong once (see ProductSwitcher's old
 * history): both groups must render together, a locked group's rows must
 * stay VISIBLE rather than disappear, and a locked row must still be a link
 * to the upgrade page rather than a dead end.
 */

function LocationSpy({ into }) {
  const { pathname } = useLocation();
  if (into[into.length - 1] !== pathname) into.push(pathname);
  return null;
}

function renderLayout(hasHub, visited = []) {
  const billing = { status: { hasHub: () => hasHub }, ready: true, loading: false };
  const utils = renderWithProviders(
    <SubscriptionContext.Provider value={billing}>
      <LocationSpy into={visited} />
      <DashboardLayout title="Test">content</DashboardLayout>
    </SubscriptionContext.Provider>,
    { route: '/dashboard/people' },
  );
  return { ...utils, visited };
}

describe('DashboardLayout — grouped sidebar', () => {
  it('renders both product groups at once, no switcher', () => {
    renderLayout(true);
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Extension Driven')).toBeTruthy();
    expect(within(nav).getByText('Automated')).toBeTruthy();
    // Both groups' rows are on screen simultaneously.
    expect(within(nav).getByText('Contacts')).toBeTruthy();
    expect(within(nav).getByText('Leads')).toBeTruthy();
  });

  it('keeps a locked Hub visible with every row, instead of hiding the section', () => {
    renderLayout(false);
    const nav = screen.getByRole('navigation');
    // Every Hub row from HUB_SECTIONS is still present, not stripped out.
    expect(within(nav).getByText('Leads')).toBeTruthy();
    expect(within(nav).getByText('Sequences')).toBeTruthy();
    expect(within(nav).getByText('Inbox')).toBeTruthy();
  });

  it('a locked Hub row routes to the upgrade page, not its normal destination', async () => {
    const user = userEvent.setup();
    const visited = [];
    renderLayout(false, visited);

    await user.click(screen.getByText('Leads'));

    expect(visited[visited.length - 1]).toBe('/hub/upgrade');
  });

  it('an entitled Hub row keeps its normal destination — no upgrade redirect', async () => {
    const user = userEvent.setup();
    const visited = [];
    renderLayout(true, visited);

    await user.click(screen.getByText('Leads'));

    expect(visited[visited.length - 1]).toBe('/hub/leads');
  });
});
