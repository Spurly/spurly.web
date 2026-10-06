import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { stubGateway } from './gateway.js';

/**
 * Native LinkedIn sign-in — our own dialog instead of the provider's hosted
 * page. Pins the paths a real user goes through: straight in, a code, an app
 * approval, a wrong password, and the hosted page as the way out when the
 * native flow cannot finish (and as the default when the server switches to it).
 */

const state = { account: { connected: false, status: null, connectFlow: 'credentials' } };
const connected = { connected: true, status: 'OK', linkedinName: 'Sarthak Vats', connectionMethod: 'credentials', connectFlow: 'credentials' };

const calls = [];
const replies = {}; // path -> array of (body) => value | throws
const reply = (path) => (url, body) => {
  calls.push({ path, body });
  const next = replies[path]?.shift();
  if (!next) throw new Error(`test: no reply queued for ${path}`);
  return next(body);
};
const fail = (status, code, message, fallback = false) => () => {
  throw { success: false, status, message, data: { code, fallback } };
};

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/account': () => ({ success: true, data: { account: state.account } }),
  'POST /hub/account/refresh': () => ({ success: true, data: { account: state.account } }),
  'POST /hub/account/link': reply('/link'),
  'POST /hub/account/connect': reply('/connect'),
  'POST /hub/account/connect/checkpoint': reply('/checkpoint'),
  'POST /hub/account/connect/checkpoint/another-way': reply('/another-way'),
  'POST /hub/account/connect/checkpoint/resend': reply('/resend'),
  'POST /hub/account/connect/checkpoint/status': reply('/status'),
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { LinkedInSettingsPage } = await import('src/products/pages/settings/index.jsx');

const ROUTE = '/dashboard/settings/linkedin';

async function openDialog() {
  renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
  await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /connect linkedin/i }));
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
}

function signIn(email = 'me@x.com', password = 'secret-pw') {
  fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Your LinkedIn password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));
}

describe('native LinkedIn sign-in', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    state.account = { connected: false, status: null, connectFlow: 'credentials' };
    calls.length = 0;
    Object.keys(replies).forEach((k) => delete replies[k]);
  });

  it('connects straight away when LinkedIn asks for nothing more', async () => {
    replies['/connect'] = [() => ({ success: true, data: { state: 'connected', account: connected } })];
    await openDialog();
    signIn();

    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
    expect(screen.getByText('Sarthak Vats')).toBeInTheDocument();
    expect(calls[0]).toEqual({ path: '/connect', body: { username: 'me@x.com', password: 'secret-pw' } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // The hosted page was never involved.
    expect(calls.some((c) => c.path === '/link')).toBe(false);
  });

  it('asks for the emailed code, then connects', async () => {
    replies['/connect'] = [() => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: 'OTP' } } })];
    replies['/checkpoint'] = [() => ({ success: true, data: { state: 'connected', account: connected } })];
    await openDialog();
    signIn();

    await waitFor(() => expect(screen.getByText('Check your email or phone')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: ' 482913 ' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
    expect(calls.find((c) => c.path === '/checkpoint').body).toEqual({ code: '482913' });
  });

  it('2FA: a wrong code shows the server’s message and lets the user retry', async () => {
    replies['/connect'] = [() => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: '2FA' } } })];
    replies['/checkpoint'] = [
      fail(422, 'INVALID_CODE', 'That code didn’t work. Check it and try again.'),
      () => ({ success: true, data: { state: 'connected', account: connected } }),
    ];
    await openDialog();
    signIn();

    await waitFor(() => expect(screen.getByText('Enter your verification code')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('That code didn’t work'));
    // A wrong code is not a reason to offer the hosted page.
    expect(screen.queryByText(/use the secure sign-in page/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
  });

  it('phone number: sends it in the provider’s (+code)number format', async () => {
    replies['/connect'] = [() => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: 'PHONE_REGISTER' } } })];
    replies['/checkpoint'] = [() => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: 'OTP' } } })];
    await openDialog();
    signIn();

    await waitFor(() => expect(screen.getByText('Add a phone number')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('9876543210'), { target: { value: '98765 43210' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getByText('Check your email or phone')).toBeInTheDocument());
    expect(calls.find((c) => c.path === '/checkpoint').body).toEqual({ code: '(+91)9876543210' });
  });

  it('app approval: waits, then connects when the server sees the approval', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      replies['/connect'] = [() => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: 'IN_APP_VALIDATION' } } })];
      replies['/status'] = [
        () => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: 'IN_APP_VALIDATION' } } }),
        () => ({ success: true, data: { state: 'connected', account: connected } }),
      ];
      await openDialog();
      signIn();

      await waitFor(() => expect(screen.getByText('Approve the sign-in')).toBeInTheDocument());
      expect(screen.getByText(/waiting for your approval/i)).toBeInTheDocument();

      await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
      await act(async () => { await vi.advanceTimersByTimeAsync(3100); });

      await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
      expect(calls.filter((c) => c.path === '/status')).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('try another way switches to the new checkpoint', async () => {
    replies['/connect'] = [() => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: 'IN_APP_VALIDATION' } } })];
    replies['/another-way'] = [() => ({ success: true, data: { state: 'checkpoint', checkpoint: { type: 'OTP' } } })];
    await openDialog();
    signIn();

    await waitFor(() => expect(screen.getByText('Approve the sign-in')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /try another way/i }));
    await waitFor(() => expect(screen.getByText('Check your email or phone')).toBeInTheDocument());
  });

  it('a wrong password shows why, without signing the user out or offering the hosted page', async () => {
    replies['/connect'] = [fail(422, 'INVALID_CREDENTIALS', 'That email and password didn’t work on LinkedIn. Check them and try again.')];
    await openDialog();
    signIn();

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('didn’t work on LinkedIn'));
    expect(screen.queryByText(/use the secure sign-in page/i)).not.toBeInTheDocument();
    // The password field is cleared after an attempt.
    expect(screen.getByPlaceholderText('Your LinkedIn password')).toHaveValue('');
  });

  it('offers the hosted page when the native flow cannot finish, and opens it', async () => {
    const tab = { location: null, close: vi.fn() };
    const open = vi.spyOn(window, 'open').mockReturnValue(tab);
    replies['/connect'] = [fail(422, 'UNSUPPORTED_CHECKPOINT', 'LinkedIn asked for an extra check we can’t show here.', true)];
    replies['/link'] = [() => ({ success: true, data: { url: 'https://hosted.example/auth', mode: 'create' } })];
    await openDialog();
    signIn();

    const button = await screen.findByRole('button', { name: /use the secure sign-in page/i });
    fireEvent.click(button);

    await waitFor(() => expect(tab.location).toBe('https://hosted.example/auth'));
    expect(open).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    open.mockRestore();
  });

  it('goes straight to the hosted page when the server switches the flow to hosted', async () => {
    state.account = { connected: false, status: null, connectFlow: 'hosted' };
    const tab = { location: null, close: vi.fn() };
    const open = vi.spyOn(window, 'open').mockReturnValue(tab);
    replies['/link'] = [() => ({ success: true, data: { url: 'https://hosted.example/auth', mode: 'create' } })];

    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /connect linkedin/i }));

    await waitFor(() => expect(tab.location).toBe('https://hosted.example/auth'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    open.mockRestore();
  });
});
