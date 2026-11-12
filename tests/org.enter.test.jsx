import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

/**
 * "Open in Spurly" for an organization: /login/org/enter#t=<ticket>. The ticket is read from the URL
 * fragment and erased at once, spent exactly once (also under StrictMode), stores the session like an org
 * sign-in does, optionally chooses the "Acting as" account, asks before replacing a personal session, and
 * shows one calm state for anything that goes wrong.
 */

let authed;
let exchangeResult;

vi.mock('src/shared/gateway/apiGateway.js', () => ({
  default: {
    post: vi.fn(async (url) => {
      if (url !== '/org/login/exchange') throw new Error(`gateway stub: no route for POST ${url}`);
      return { data: await exchangeResult() };
    }),
    get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    isAuthenticated: () => authed,
  },
  isPublicPath: () => true,
}));

const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;
const { default: OrgEnterPage } = await import('src/core/pages/auth/OrgEnterPage.jsx');
const { getActiveAccountId } = await import('src/shared/orgAccount/activeAccount.js');
const { ORG_COPY } = await import('src/core/org/constants/constants.js');

let replace;
let replaceState;

const ok = (extra = {}) => ({
  success: true,
  data: {
    token: 'org-token',
    user: { id: 'u9', name: 'ABC Ltd', email: 'abc@example.com' },
    orgs: [{ id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active' }],
    orgId: 'o1',
    accountId: null,
    ...extra,
  },
});

beforeEach(() => {
  authed = false;
  exchangeResult = async () => ok();
  replace = vi.fn();
  localStorage.clear();
  apiGateway.post.mockClear();
  apiGateway.setToken.mockClear();
  vi.stubGlobal('location', { hash: '#t=ticket-abc-123456789', pathname: '/login/org/enter', search: '', replace });
  replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  replaceState.mockRestore();
});

const renderEnter = (Wrapper = ({ children }) => children) => render(
  <Wrapper>
    <HelmetProvider>
      <MemoryRouter initialEntries={['/login/org/enter']}>
        <OrgEnterPage />
      </MemoryRouter>
    </HelmetProvider>
  </Wrapper>,
);

describe('/login/org/enter', () => {
  it('erases the ticket from the address bar, spends it once and opens Settings -> Organization', async () => {
    renderEnter();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard/settings?tab=organization'));
    expect(replaceState).toHaveBeenCalledWith(null, '', '/login/org/enter');
    expect(apiGateway.post).toHaveBeenCalledTimes(1);
    expect(apiGateway.post).toHaveBeenCalledWith('/org/login/exchange', { ticket: 'ticket-abc-123456789' });
  });

  it('stores the session exactly like an org sign-in (token, user, org marker)', async () => {
    renderEnter();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(apiGateway.setToken).toHaveBeenCalledWith('org-token');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ _id: 'u9', email: 'abc@example.com', onboardingComplete: true });
    expect(localStorage.getItem('orgSessionUser')).toBe('u9');
    expect(localStorage.getItem('managedSession')).toBeNull();
  });

  it('drops a saved admin "login as" session and a managed marker first', async () => {
    localStorage.setItem('adminAuthToken', 'admin-tok');
    localStorage.setItem('adminUser', '{}');
    localStorage.setItem('managedSession', '1');
    renderEnter();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(localStorage.getItem('adminAuthToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
    expect(localStorage.getItem('managedSession')).toBeNull();
  });

  it('spends the ticket only once under StrictMode', async () => {
    renderEnter(({ children }) => <StrictMode>{children}</StrictMode>);
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(apiGateway.post).toHaveBeenCalledTimes(1);
  });

  it('a link that chose a LinkedIn account makes it the "Acting as" account for the new member', async () => {
    exchangeResult = async () => ok({ accountId: 'acc-7' });
    renderEnter();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(getActiveAccountId()).toBe('acc-7');
  });

  it('a link with no account leaves an existing "Acting as" choice for that member alone', async () => {
    localStorage.setItem('user', JSON.stringify({ _id: 'u9' }));
    localStorage.setItem('orgActiveAccount', JSON.stringify({ userId: 'u9', accountId: 'keep-me' }));
    renderEnter();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(JSON.parse(localStorage.getItem('orgActiveAccount'))).toMatchObject({ userId: 'u9', accountId: 'keep-me' });
  });
});

describe('when something goes wrong', () => {
  it('an expired link says so, stores nothing and does not navigate', async () => {
    exchangeResult = async () => { throw { status: 410, message: 'This link has expired.', error: 'LINK_EXPIRED' }; };
    renderEnter();
    expect(await screen.findByText(ORG_COPY.enter.expiredTitle)).toBeInTheDocument();
    expect(screen.getByText(ORG_COPY.enter.expiredBody)).toBeInTheDocument();
    expect(apiGateway.setToken).not.toHaveBeenCalled();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('orgSessionUser')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('a page opened without a ticket is the same expired state, and nothing is sent', async () => {
    vi.stubGlobal('location', { hash: '', pathname: '/login/org/enter', search: '', replace });
    renderEnter();
    expect(await screen.findByText(ORG_COPY.enter.expiredTitle)).toBeInTheDocument();
    expect(apiGateway.post).not.toHaveBeenCalled();
  });

  it('an answer without a token or user is treated as a failure and stores nothing', async () => {
    exchangeResult = async () => ({ success: true, data: { orgs: [] } });
    renderEnter();
    expect(await screen.findByText(ORG_COPY.enter.expiredTitle)).toBeInTheDocument();
    expect(localStorage.getItem('user')).toBeNull();
    expect(apiGateway.setToken).not.toHaveBeenCalled();
  });

  it('the rate limit and a lost connection get their own honest message', async () => {
    exchangeResult = async () => { throw { status: 429, message: 'Too many attempts.', error: 'RATE_LIMITED' }; };
    const first = renderEnter();
    expect(await screen.findByText(ORG_COPY.enter.busyTitle)).toBeInTheDocument();
    first.unmount();

    vi.stubGlobal('location', { hash: '#t=ticket-abc-123456789', pathname: '/login/org/enter', search: '', replace });
    exchangeResult = async () => { throw { status: 0, message: 'Network error' }; };
    renderEnter();
    expect(await screen.findByText(ORG_COPY.enter.offlineTitle)).toBeInTheDocument();
  });

  it('never shows a partner or provider name', async () => {
    exchangeResult = async () => { throw { status: 410, error: 'LINK_EXPIRED', message: 'x' }; };
    const { container } = renderEnter();
    await screen.findByText(ORG_COPY.enter.expiredTitle);
    expect(container.textContent).not.toMatch(/dexkor|unipile/i);
  });
});

describe('when a session is already here', () => {
  beforeEach(() => {
    authed = true;
    localStorage.setItem('authToken', 'old');
    localStorage.setItem('user', JSON.stringify({ _id: 'p1', email: 'me@example.com' }));
  });

  it('a personal session is asked about first, and nothing is spent until they agree', async () => {
    renderEnter();
    expect(await screen.findByText(ORG_COPY.enter.confirmTitle)).toBeInTheDocument();
    expect(screen.getByText(/me@example\.com/)).toBeInTheDocument();
    expect(apiGateway.post).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard/settings?tab=organization'));
    expect(apiGateway.post).toHaveBeenCalledTimes(1);
  });

  it('staying signed in goes to the dashboard and never spends the ticket', async () => {
    renderEnter();
    await userEvent.click(await screen.findByRole('button', { name: 'Stay signed in' }));
    expect(replace).toHaveBeenCalledWith('/dashboard');
    expect(apiGateway.post).not.toHaveBeenCalled();
    expect(apiGateway.setToken).not.toHaveBeenCalled();
  });

  it('an organization member\'s own session is replaced without asking', async () => {
    localStorage.setItem('orgSessionUser', 'p1');
    renderEnter();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard/settings?tab=organization'));
    expect(screen.queryByText(ORG_COPY.enter.confirmTitle)).not.toBeInTheDocument();
  });
});
