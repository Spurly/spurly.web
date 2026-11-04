import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';
import { renderWithProviders, anonymousAuth } from './helpers.jsx';

/**
 * Org sign-in: email -> 6-digit code -> a stored session and a full page load
 * into Settings -> Organization. A wrong code stores nothing.
 */

let verifyResult;
const posted = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'POST /org/login/request': () => ({ success: true, data: { sent: true } }),
  'POST /org/login/verify': () => verifyResult(),
}));

const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;
const { default: OrgLoginPage } = await import('src/core/pages/auth/OrgLoginPage.jsx');

const realLocation = window.location;
const replace = vi.fn();

function renderPage() {
  return renderWithProviders(<HelmetProvider><OrgLoginPage /></HelmetProvider>, { auth: anonymousAuth, route: '/login/org' });
}

beforeEach(() => {
  posted.length = 0;
  replace.mockClear();
  localStorage.clear();
  Object.defineProperty(window, 'location', { configurable: true, value: { ...realLocation, replace } });
  verifyResult = () => ({
    success: true,
    data: {
      token: 'org-token',
      user: { id: 'u9', name: 'ABC Ltd', email: 'abc@example.com' },
      orgs: [{ id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active' }],
    },
  });
});
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

async function enterEmail(email = 'abc@example.com') {
  await userEvent.type(await screen.findByLabelText('Organization email'), email);
  await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
}

describe('org sign-in', () => {
  it('asks for the code after the email, then opens the session and goes to Settings -> Organization', async () => {
    renderPage();
    await enterEmail();
    expect(apiGateway.post).toHaveBeenCalledWith('/org/login/request', { email: 'abc@example.com' });

    const code = await screen.findByLabelText('6-digit code');
    await userEvent.type(code, '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard/settings?tab=organization'));
    expect(apiGateway.post).toHaveBeenCalledWith('/org/login/verify', { email: 'abc@example.com', code: '123456' });
    expect(apiGateway.setToken).toHaveBeenCalledWith('org-token');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ _id: 'u9', email: 'abc@example.com', onboardingComplete: true });
    expect(localStorage.getItem('orgSessionUser')).toBe('u9');
  });

  it('only accepts digits and needs all six before it signs in', async () => {
    renderPage();
    await enterEmail();
    const code = await screen.findByLabelText('6-digit code');
    await userEvent.type(code, '12a34');
    expect(code).toHaveValue('1234');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('shows the server message for a wrong code and stores nothing', async () => {
    verifyResult = () => { throw { status: 400, message: 'That code is wrong or has expired.', error: 'INVALID_CODE' }; };
    renderPage();
    await enterEmail();
    await userEvent.type(await screen.findByLabelText('6-digit code'), '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('That code is wrong or has expired.')).toBeInTheDocument();
    expect(apiGateway.setToken).not.toHaveBeenCalled();
    expect(localStorage.getItem('orgSessionUser')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('tells a personal-account email to use a different one', async () => {
    verifyResult = () => { throw { status: 409, message: 'This email already has a Spurly account. Use a different email.', error: 'EMAIL_TAKEN' }; };
    renderPage();
    await enterEmail();
    await userEvent.type(await screen.findByLabelText('6-digit code'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/already has a Spurly account/)).toBeInTheDocument();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('can go back and use a different email', async () => {
    renderPage();
    await enterEmail();
    await userEvent.click(await screen.findByRole('button', { name: 'Use a different email' }));
    expect(await screen.findByLabelText('Organization email')).toBeInTheDocument();
  });
});
