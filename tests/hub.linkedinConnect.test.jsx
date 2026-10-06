import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { stubGateway } from './gateway.js';

/**
 * Native LinkedIn sign-in — Spurly's own dialog instead of the provider's
 * hosted page. Pins the paths a real user goes through: straight in, a code,
 * an app approval, a phone number, a session cookie, the sync and location
 * options, a wrong password, and the hosted page as the way out when the
 * native flow cannot finish (and as the default when the server switches).
 */

const state = { account: { connected: false, status: null, connectFlow: 'credentials' } };
const connected = { connected: true, status: 'OK', linkedinName: 'Sarthak Vats', connectionMethod: 'credentials', connectFlow: 'credentials' };

const calls = [];
const replies = {}; // path -> queue of (body) => value | throws
const reply = (path) => (url, body) => {
  calls.push({ path, body });
  const next = replies[path]?.shift();
  if (!next) throw new Error(`test: no reply queued for ${path}`);
  return next(body);
};
const fail = (status, code, message, { fallback = false, field } = {}) => () => {
  throw { success: false, status, message, data: { code, fallback, ...(field ? { field } : {}) } };
};
const ok = (data) => () => ({ success: true, data });

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/account': () => ({ success: true, data: { account: state.account } }),
  'GET /hub/account/connect/options': { success: true, data: { detectedCountry: 'IN' } },
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
const dialog = () => screen.getByRole('dialog');
const inDialog = () => within(dialog());

async function openDialog() {
  renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
  await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /connect linkedin/i }));
  await waitFor(() => expect(dialog()).toBeInTheDocument());
}

function submit() {
  fireEvent.click(inDialog().getByRole('button', { name: /connect linkedin/i }));
}

function signIn(email = 'me@x.com', password = 'secret-pw') {
  fireEvent.change(inDialog().getByLabelText('Email or phone'), { target: { value: email } });
  fireEvent.change(inDialog().getByLabelText('LinkedIn password'), { target: { value: password } });
  submit();
}

async function expectSuccess() {
  await waitFor(() => expect(inDialog().getByText('LinkedIn connected')).toBeInTheDocument());
  expect(inDialog().getByText('Sarthak Vats')).toBeInTheDocument();
  fireEvent.click(inDialog().getByRole('button', { name: /^done$/i }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Connected')).toBeInTheDocument();
}

describe('native LinkedIn sign-in', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    state.account = { connected: false, status: null, connectFlow: 'credentials' };
    calls.length = 0;
    Object.keys(replies).forEach((k) => delete replies[k]);
  });

  it('shows Spurly and LinkedIn side by side, and the automatic location it detected', async () => {
    await openDialog();
    expect(inDialog().getByText('Connect your LinkedIn')).toBeInTheDocument();
    expect(inDialog().getByText(/never stored/i)).toBeInTheDocument();
    await waitFor(() => expect(inDialog().getByText(/Automatic \(India\)/)).toBeInTheDocument());
  });

  it('connects straight away, then shows who is connected', async () => {
    replies['/connect'] = [ok({ state: 'connected', account: connected })];
    await openDialog();
    signIn();

    await expectSuccess();
    expect(calls[0]).toEqual({
      path: '/connect',
      body: {
        method: 'credentials',
        username: 'me@x.com',
        password: 'secret-pw',
        sync: { chats: true, messages: true },
        location: { mode: 'auto' },
      },
    });
    expect(calls.some((c) => c.path === '/link')).toBe(false);
  });

  it('catches empty fields in place, without calling LinkedIn', async () => {
    await openDialog();
    submit();
    expect(await inDialog().findByText(/enter the email or phone/i)).toBeInTheDocument();
    expect(inDialog().getByText(/enter your linkedin password/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('asks for the emailed code, then connects', async () => {
    replies['/connect'] = [ok({ state: 'checkpoint', checkpoint: { type: 'OTP', expiresAt: new Date(Date.now() + 300000).toISOString() } })];
    replies['/checkpoint'] = [ok({ state: 'connected', account: connected })];
    await openDialog();
    signIn();

    await waitFor(() => expect(inDialog().getByText('Check your email or phone')).toBeInTheDocument());
    expect(inDialog().getByText(/Expires in \d:\d\d/)).toBeInTheDocument();
    fireEvent.change(inDialog().getByLabelText('Verification code'), { target: { value: ' 482 913 ' } });
    fireEvent.click(inDialog().getByRole('button', { name: /^verify$/i }));

    await expectSuccess();
    expect(calls.find((c) => c.path === '/checkpoint').body).toEqual({ code: '482913' });
  });

  it('2FA: a wrong code explains itself and lets the user retry', async () => {
    replies['/connect'] = [ok({ state: 'checkpoint', checkpoint: { type: '2FA' } })];
    replies['/checkpoint'] = [
      fail(422, 'INVALID_CODE', 'That code didn’t work. Check it and try again.', { field: 'code' }),
      ok({ state: 'connected', account: connected }),
    ];
    await openDialog();
    signIn();

    await waitFor(() => expect(inDialog().getByText('Enter your verification code')).toBeInTheDocument());
    fireEvent.change(inDialog().getByLabelText('Authenticator code'), { target: { value: '000000' } });
    fireEvent.click(inDialog().getByRole('button', { name: /^verify$/i }));
    const alert = await inDialog().findByRole('alert');
    expect(alert).toHaveTextContent('That code didn’t work');
    expect(screen.queryByText(/secure sign-in page/i)).not.toBeInTheDocument();

    fireEvent.change(inDialog().getByLabelText('Authenticator code'), { target: { value: '123456' } });
    fireEvent.click(inDialog().getByRole('button', { name: /^verify$/i }));
    await expectSuccess();
  });

  it('phone number: sends it in the provider’s (+code)number format', async () => {
    replies['/connect'] = [ok({ state: 'checkpoint', checkpoint: { type: 'PHONE_REGISTER' } })];
    replies['/checkpoint'] = [ok({ state: 'checkpoint', checkpoint: { type: 'OTP' } })];
    await openDialog();
    signIn();

    await waitFor(() => expect(inDialog().getByText('Add a phone number')).toBeInTheDocument());
    fireEvent.change(inDialog().getByLabelText('Phone number'), { target: { value: '98765 43210' } });
    fireEvent.click(inDialog().getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(inDialog().getByText('Check your email or phone')).toBeInTheDocument());
    expect(calls.find((c) => c.path === '/checkpoint').body).toEqual({ code: '(+91)9876543210' });
  });

  it('app approval: waits, then connects when the server sees the approval', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      replies['/connect'] = [ok({ state: 'checkpoint', checkpoint: { type: 'IN_APP_VALIDATION' } })];
      replies['/status'] = [
        ok({ state: 'checkpoint', checkpoint: { type: 'IN_APP_VALIDATION' } }),
        ok({ state: 'connected', account: connected }),
      ];
      await openDialog();
      signIn();

      await waitFor(() => expect(inDialog().getByText('Approve on your phone')).toBeInTheDocument());
      expect(inDialog().getByText(/waiting for your approval/i)).toBeInTheDocument();

      await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
      await act(async () => { await vi.advanceTimersByTimeAsync(3100); });

      await waitFor(() => expect(inDialog().getByText('LinkedIn connected')).toBeInTheDocument());
      expect(calls.filter((c) => c.path === '/status')).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('try another way switches to the new checkpoint and says so', async () => {
    replies['/connect'] = [ok({ state: 'checkpoint', checkpoint: { type: 'IN_APP_VALIDATION' } })];
    replies['/another-way'] = [ok({ state: 'checkpoint', checkpoint: { type: 'OTP' } })];
    await openDialog();
    signIn();

    await waitFor(() => expect(inDialog().getByText('Approve on your phone')).toBeInTheDocument());
    fireEvent.click(inDialog().getByRole('button', { name: /try another way/i }));
    await waitFor(() => expect(inDialog().getByText('Check your email or phone')).toBeInTheDocument());
    expect(inDialog().getByText(/switched to a different way/i)).toBeInTheDocument();
  });

  it('“use a different account” goes back to the sign-in form', async () => {
    replies['/connect'] = [ok({ state: 'checkpoint', checkpoint: { type: 'OTP' } })];
    await openDialog();
    signIn();
    await waitFor(() => expect(inDialog().getByText('Check your email or phone')).toBeInTheDocument());
    fireEvent.click(inDialog().getByRole('button', { name: /use a different account/i }));
    expect(inDialog().getByLabelText('Email or phone')).toBeInTheDocument();
  });

  it('a wrong password gets a clear title, keeps the user signed in, and clears the password', async () => {
    replies['/connect'] = [fail(422, 'INVALID_CREDENTIALS', 'That email and password didn’t work on LinkedIn. Check them and try again.', { field: 'password' })];
    await openDialog();
    signIn();

    const alert = await inDialog().findByRole('alert');
    expect(alert).toHaveTextContent('Wrong email or password');
    expect(alert).toHaveTextContent('didn’t work on LinkedIn');
    expect(screen.queryByText(/secure sign-in page/i)).not.toBeInTheDocument();
    expect(inDialog().getByLabelText('LinkedIn password')).toHaveValue('');
    expect(localStorage.getItem('authToken')).toBe('test-token');
  });

  it('connects with a session cookie and this browser’s user agent', async () => {
    replies['/connect'] = [ok({ state: 'connected', account: connected })];
    await openDialog();
    fireEvent.click(inDialog().getByLabelText(/session cookie/i));
    fireEvent.change(inDialog().getByLabelText('li_at cookie'), { target: { value: 'AQEDAR0123456789abcdefghijklmnop' } });
    submit();

    await expectSuccess();
    const body = calls[0].body;
    expect(body).toMatchObject({ method: 'cookies', accessToken: 'AQEDAR0123456789abcdefghijklmnop', userAgent: navigator.userAgent });
    expect(body.password).toBeUndefined();
  });

  it('rejects a whole cookie line in place', async () => {
    await openDialog();
    fireEvent.click(inDialog().getByLabelText(/session cookie/i));
    fireEvent.change(inDialog().getByLabelText('li_at cookie'), { target: { value: 'li_at=abc; JSESSIONID=x' } });
    submit();
    expect(await inDialog().findByText(/only the li_at value/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('sends the sync and country choices from “Sync & location”', async () => {
    replies['/connect'] = [ok({ state: 'connected', account: connected })];
    await openDialog();
    fireEvent.click(inDialog().getByText('Sync & location'));
    fireEvent.click(inDialog().getByRole('switch', { name: 'Sync message history' }));
    fireEvent.click(inDialog().getByLabelText(/a specific country/i));
    fireEvent.click(inDialog().getByRole('button', { name: 'Country' }));
    fireEvent.click(screen.getByRole('option', { name: /germany/i }));
    signIn();

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body).toMatchObject({
      sync: { chats: true, messages: false },
      location: { mode: 'country', country: 'DE' },
    });
  });

  it('validates a custom proxy before sending, then sends it', async () => {
    replies['/connect'] = [ok({ state: 'connected', account: connected })];
    await openDialog();
    fireEvent.click(inDialog().getByText('Sync & location'));
    fireEvent.click(inDialog().getByLabelText(/my own proxy/i));
    signIn();
    expect(await inDialog().findByText('1–65535')).toBeInTheDocument();
    expect(calls).toHaveLength(0);

    fireEvent.change(inDialog().getByLabelText('Host'), { target: { value: 'proxy.example.com' } });
    fireEvent.change(inDialog().getByLabelText('Port'), { target: { value: '1080' } });
    fireEvent.click(inDialog().getByRole('button', { name: 'Proxy protocol' }));
    fireEvent.click(screen.getByRole('option', { name: 'SOCKS5' }));
    fireEvent.change(inDialog().getByLabelText('LinkedIn password'), { target: { value: 'secret-pw' } });
    submit();

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body.location).toEqual({
      mode: 'proxy',
      proxy: { protocol: 'socks5', host: 'proxy.example.com', port: 1080, username: undefined, password: undefined },
    });
  });

  it('offers the hosted page when the native flow cannot finish, and opens it', async () => {
    const tab = { location: null, close: vi.fn() };
    const open = vi.spyOn(window, 'open').mockReturnValue(tab);
    replies['/connect'] = [fail(422, 'UNSUPPORTED_CHECKPOINT', 'LinkedIn asked for an extra check we can’t show here.', { fallback: true })];
    replies['/link'] = [ok({ url: 'https://hosted.example/auth', mode: 'create' })];
    await openDialog();
    signIn();

    const button = await inDialog().findByRole('button', { name: /secure sign-in page/i });
    expect(inDialog().getByRole('alert')).toHaveTextContent('LinkedIn needs an extra check');
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
    replies['/link'] = [ok({ url: 'https://hosted.example/auth', mode: 'create' })];

    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /connect linkedin/i }));

    await waitFor(() => expect(tab.location).toBe('https://hosted.example/auth'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    open.mockRestore();
  });
});
