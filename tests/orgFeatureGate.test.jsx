import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/** D50: the Inbox page is unreachable for a member of an organization whose inbox is off; solo users and a not-yet-loaded answer pass. */

const state = { isMember: true, loaded: true, features: { inbox: false } };
vi.mock('src/core/org/hooks/useOrgState.js', () => ({ useOrgState: () => state }));

const { OrgFeatureGate } = await import('src/core/org/components/OrgFeatureGate.jsx');

const renderAt = () => render(
  <MemoryRouter initialEntries={['/hub/inbox']}>
    <Routes>
      <Route path="/hub/inbox" element={<OrgFeatureGate feature="inbox"><div>Inbox page</div></OrgFeatureGate>} />
      <Route path="/dashboard/settings" element={<div>Settings page</div>} />
    </Routes>
  </MemoryRouter>,
);

describe('OrgFeatureGate', () => {
  it('sends a member of an inbox-off org to Settings', () => {
    Object.assign(state, { isMember: true, loaded: true, features: { inbox: false } });
    renderAt();
    expect(screen.getByText('Settings page')).toBeInTheDocument();
    expect(screen.queryByText('Inbox page')).toBeNull();
  });

  it('lets a member of an inbox-on org in', () => {
    Object.assign(state, { isMember: true, loaded: true, features: { inbox: true } });
    renderAt();
    expect(screen.getByText('Inbox page')).toBeInTheDocument();
  });

  it('lets a solo user in, and waits for the server answer before deciding', () => {
    Object.assign(state, { isMember: false, loaded: true, features: { inbox: false } });
    renderAt();
    expect(screen.getByText('Inbox page')).toBeInTheDocument();
  });

  it('does not redirect before the answer has loaded', () => {
    Object.assign(state, { isMember: true, loaded: false, features: { inbox: false } });
    renderAt();
    expect(screen.getByText('Inbox page')).toBeInTheDocument();
  });
});
