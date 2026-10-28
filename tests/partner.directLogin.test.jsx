import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { renderWithProviders, signedInAs } from './helpers.jsx';
import directLoginGateway from 'src/core/directLogin/gateway/directLogin.js';
import { User } from 'src/core/auth/entities/User.js';
import { DIRECT_LOGIN_COPY } from 'src/core/directLogin/constants/constants.js';
import { DirectLoginCard } from 'src/products/pages/accountSettings/components/DirectLoginCard.jsx';
import { ConnectionCard } from 'src/products/pages/settings/components/ConnectionCard.jsx';
import { PARTNER_COPY } from 'src/core/partner/constants/constants.js';
import PartnerEndedPage from 'src/core/pages/partner/PartnerEndedPage.jsx';
import partnerController from 'src/core/partner/controller/partner.js';
import apiGateway from 'src/shared/gateway/apiGateway.js';

vi.mock('src/core/directLogin/gateway/directLogin.js', () => ({ default: { requestCode: vi.fn(), verifyCode: vi.fn() } }));

const managed = (overrides = {}) => ({ ...signedInAs({ name: 'Jane Rep', email: 'acct.ab12@managed.getspurly.com', isManaged: true, ...overrides }), refetchUser: vi.fn() });

beforeEach(() => {
  directLoginGateway.requestCode.mockReset();
  directLoginGateway.verifyCode.mockReset();
  localStorage.clear();
});

async function fillForm(user) {
  await user.type(screen.getByLabelText(DIRECT_LOGIN_COPY.emailLabel), 'jane@acme.com');
  await user.type(screen.getByLabelText(DIRECT_LOGIN_COPY.passwordLabel), 'correct-horse-9');
  await user.type(screen.getByLabelText(DIRECT_LOGIN_COPY.confirmLabel), 'correct-horse-9');
}

describe('Set up a direct login', () => {
  it('sends a code, confirms it, then refreshes the signed-in user', async () => {
    const user = userEvent.setup();
    const auth = managed();
    directLoginGateway.requestCode.mockResolvedValue({ email: 'jane@acme.com', expiresInMinutes: 10 });
    directLoginGateway.verifyCode.mockResolvedValue(User.fromResponse({ _id: 'm1', email: 'jane@acme.com', isManaged: true, hasDirectLogin: true }));

    renderWithProviders(<DirectLoginCard />, { auth });
    const send = screen.getByRole('button', { name: DIRECT_LOGIN_COPY.sendCode });
    expect(send).toBeDisabled();
    await fillForm(user);
    await user.click(send);

    expect(directLoginGateway.requestCode).toHaveBeenCalledWith({ email: 'jane@acme.com', password: 'correct-horse-9', confirmPassword: 'correct-horse-9' });
    expect(await screen.findByText(DIRECT_LOGIN_COPY.codeIntro('jane@acme.com'))).toBeInTheDocument();

    await user.type(screen.getByLabelText(DIRECT_LOGIN_COPY.codeLabel), '123456');
    await user.click(screen.getByRole('button', { name: DIRECT_LOGIN_COPY.confirm }));
    expect(directLoginGateway.verifyCode).toHaveBeenCalledWith('123456');
    await waitFor(() => expect(auth.refetchUser).toHaveBeenCalled());
    expect(await screen.findByText(DIRECT_LOGIN_COPY.success)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('user')).hasDirectLogin).toBe(true);
  });

  it('shows the server reason when the email is taken, and stays on the form', async () => {
    const user = userEvent.setup();
    directLoginGateway.requestCode.mockRejectedValue({ status: 409, code: 'EMAIL_TAKEN', message: 'This email already has a Spurly account. Use a different email.' });
    renderWithProviders(<DirectLoginCard />, { auth: managed() });
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: DIRECT_LOGIN_COPY.sendCode }));
    expect(await screen.findByText(/already has a Spurly account/)).toBeInTheDocument();
    expect(screen.getByLabelText(DIRECT_LOGIN_COPY.emailLabel)).toBeInTheDocument();
  });

  it('a wrong code keeps the code step; too many attempts go back to the form', async () => {
    const user = userEvent.setup();
    directLoginGateway.requestCode.mockResolvedValue({ email: 'jane@acme.com' });
    directLoginGateway.verifyCode
      .mockRejectedValueOnce({ status: 400, code: 'INVALID_CODE', message: 'That code is wrong or has expired.' })
      .mockRejectedValueOnce({ status: 400, code: 'TOO_MANY_ATTEMPTS', message: 'Too many wrong codes. Start again.' });
    renderWithProviders(<DirectLoginCard />, { auth: managed() });
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: DIRECT_LOGIN_COPY.sendCode }));
    await user.type(await screen.findByLabelText(DIRECT_LOGIN_COPY.codeLabel), '000000');
    await user.click(screen.getByRole('button', { name: DIRECT_LOGIN_COPY.confirm }));
    expect(await screen.findByText('That code is wrong or has expired.')).toBeInTheDocument();
    expect(screen.getByLabelText(DIRECT_LOGIN_COPY.codeLabel)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: DIRECT_LOGIN_COPY.confirm }));
    expect(await screen.findByText('Too many wrong codes. Start again.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(DIRECT_LOGIN_COPY.emailLabel)).toBeInTheDocument());
  });

  it('with a direct login, says how to sign in instead of offering the form', () => {
    renderWithProviders(<DirectLoginCard />, { auth: managed({ email: 'jane@acme.com', hasDirectLogin: true }) });
    expect(screen.getByText(DIRECT_LOGIN_COPY.ready('jane@acme.com'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: DIRECT_LOGIN_COPY.sendCode })).not.toBeInTheDocument();
  });

  it('never names the partner or the vendor', () => {
    expect(JSON.stringify(DIRECT_LOGIN_COPY)).not.toMatch(/dexkor|unipile/i);
  });
});

describe('Profile tab', () => {
  it('shows the email once a direct login exists, and the setup card for a managed account', async () => {
    const { ProfileTab } = await import('src/products/pages/accountSettings/components/ProfileTab.jsx');
    const { container } = renderWithProviders(<ProfileTab />, { auth: managed({ email: 'jane@acme.com', hasDirectLogin: true }) });
    expect(container.querySelector('#settings-email')?.value).toBe('jane@acme.com');
    expect(screen.getByText(DIRECT_LOGIN_COPY.title)).toBeInTheDocument();
  });

  it('a normal account gets no direct-login card', async () => {
    const { ProfileTab } = await import('src/products/pages/accountSettings/components/ProfileTab.jsx');
    renderWithProviders(<ProfileTab />, { auth: { ...signedInAs(), refetchUser: vi.fn() } });
    expect(screen.queryByText(DIRECT_LOGIN_COPY.title)).not.toBeInTheDocument();
  });
});

describe('Reconnect for a managed account with a direct login', () => {
  const noop = () => {};
  it('needs reconnect: offers Reconnect, never Disconnect', () => {
    renderWithProviders(<ConnectionCard account={{ status: 'CREDENTIALS', needsReconnect: true, linkedinName: 'Jane' }} reconnectOnly onConnect={noop} onRefresh={noop} onDisconnect={noop} />);
    expect(screen.getByText(PARTNER_COPY.reconnectOnly)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
  });

  it('disconnected: offers Reconnect', () => {
    renderWithProviders(<ConnectionCard account={{ status: 'DELETED', linkedinName: 'Jane' }} reconnectOnly onConnect={noop} onRefresh={noop} onDisconnect={noop} />);
    expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
  });

  it('healthy: no buttons, just the note', () => {
    renderWithProviders(<ConnectionCard account={{ status: 'OK', connected: true, linkedinName: 'Jane' }} reconnectOnly onConnect={noop} onRefresh={noop} onDisconnect={noop} />);
    expect(screen.queryByRole('button', { name: /reconnect|disconnect/i })).not.toBeInTheDocument();
  });
});

describe('Session ended page and the "Open in Spurly" prompt', () => {
  it('links to the login page for people with their own sign-in', () => {
    renderWithProviders(<HelmetProvider><PartnerEndedPage /></HelmetProvider>);
    expect(screen.getByRole('link', { name: PARTNER_COPY.logIn })).toHaveAttribute('href', '/login');
  });

  it('no login link when access itself has ended', () => {
    renderWithProviders(<HelmetProvider><PartnerEndedPage reason="access" /></HelmetProvider>);
    expect(screen.queryByRole('link', { name: PARTNER_COPY.logIn })).not.toBeInTheDocument();
  });

  it('a managed account signed in by its direct login is not asked before opening a link', () => {
    vi.spyOn(apiGateway, 'isAuthenticated').mockReturnValue(true);
    localStorage.setItem('user', JSON.stringify({ email: 'jane@acme.com', isManaged: true, hasDirectLogin: true }));
    expect(partnerController.getExistingSession()).toBeNull();
    localStorage.setItem('user', JSON.stringify({ email: 'me@spurly.com', isManaged: false }));
    expect(partnerController.getExistingSession()).toEqual({ email: 'me@spurly.com' });
    localStorage.setItem('user', '{not json');
    expect(partnerController.getExistingSession()).toEqual({ email: '' });
  });
});
