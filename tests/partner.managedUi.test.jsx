import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { renderWithProviders, signedInAs } from './helpers.jsx';
import { ConnectionCard } from 'src/products/pages/settings/components/ConnectionCard.jsx';
import { PARTNER_COPY } from 'src/core/partner/constants/constants.js';
import { SETTINGS_TABS } from 'src/products/pages/accountSettings/components/SettingsFrame.jsx';
import { MANAGED_HIDDEN_TABS } from 'src/products/accountSettings/constants/constants.js';
import OAuthConsentPage from 'src/products/pages/aiAssistants/OAuthConsentPage.jsx';

vi.mock('src/products/accountSettings/hooks/useProfileTab.js', () => ({
  useProfileTab: () => ({ user: { name: 'Spurly user', email: 'acct.ab12@managed.getspurly.com', isManaged: true }, name: 'Spurly user', setName: () => {}, companyName: '', setCompanyName: () => {}, saving: false, dirty: false, handleSave: () => {} }),
}));

describe('ConnectionCard for a managed account', () => {
  const noop = () => {};
  const connected = { status: 'OK', connected: true, linkedinName: 'Jane Doe' };

  it('shows status only, with no connect / reconnect / disconnect / refresh', () => {
    renderWithProviders(<ConnectionCard account={connected} readOnly onConnect={noop} onRefresh={noop} onDisconnect={noop} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(PARTNER_COPY.manageElsewhere)).toBeInTheDocument();
  });

  it('is read-only when not connected too', () => {
    renderWithProviders(<ConnectionCard account={null} readOnly onConnect={noop} onRefresh={noop} onDisconnect={noop} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(PARTNER_COPY.manageElsewhere)).toBeInTheDocument();
  });

  it('keeps its buttons for a normal user', () => {
    renderWithProviders(<ConnectionCard account={connected} onConnect={noop} onRefresh={noop} onDisconnect={noop} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});

describe('Settings for a managed account', () => {
  it('hides the assistants, team and billing tabs', () => {
    const ids = SETTINGS_TABS.map((t) => t.id);
    for (const hidden of MANAGED_HIDDEN_TABS) expect(ids).toContain(hidden);
    expect(MANAGED_HIDDEN_TABS.sort()).toEqual(['assistants', 'billing', 'team']);
  });

  it('the profile card never shows the placeholder email', async () => {
    const { ProfileTab } = await import('src/products/pages/accountSettings/components/ProfileTab.jsx');
    const { container } = renderWithProviders(<ProfileTab />, { auth: signedInAs({ isManaged: true }) });
    expect(container.textContent).not.toMatch(/managed\.getspurly\.com/);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });
});

describe('OAuth consent for a managed account', () => {
  it('says it is not available instead of asking for consent', () => {
    renderWithProviders(
      <HelmetProvider><OAuthConsentPage /></HelmetProvider>,
      { auth: signedInAs({ isManaged: true }), route: '/oauth/consent?client_id=x' },
    );
    expect(screen.getByText(PARTNER_COPY.notAvailable)).toBeInTheDocument();
  });
});
