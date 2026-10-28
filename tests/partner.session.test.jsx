import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthContext } from 'src/core/auth/hooks/AuthContext';
import { SubscriptionContext } from 'src/core/billing/hooks/SubscriptionContext';
import { SubscriptionSummary } from 'src/core/billing/entities/Subscription';
import { AuthResponse, User } from 'src/core/auth/entities/User.js';
import { anonymousAuth, signedInAs } from './helpers.jsx';
import partnerGateway from 'src/core/partner/gateway/partner.js';
import partnerController from 'src/core/partner/controller/partner.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { PARTNER_EVENTS, PARTNER_COPY } from 'src/core/partner/constants/constants.js';
import { isManagedSession, markManagedSession } from 'src/shared/utils/managedSession.js';
import { ProtectedRoute } from 'src/app/ProtectedRoute';
import { SubscribeGate } from 'src/app/SubscribeGate';
import PartnerEnterPage from 'src/core/pages/partner/PartnerEnterPage.jsx';
import PartnerEndedPage from 'src/core/pages/partner/PartnerEndedPage.jsx';
import { isPublicPath } from 'src/shared/gateway/apiGateway.js';

vi.mock('src/core/partner/gateway/partner.js', () => ({ default: { exchangeTicket: vi.fn() } }));

const sessionResponse = () =>
  AuthResponse.fromResponse({
    success: true,
    data: { user: { _id: 'm1', name: 'Spurly user', email: 'acct.ab12@managed.getspurly.com', isManaged: true }, token: 'tok-managed', managed: true },
  });

let replace;
let replaceState;

beforeEach(() => {
  replace = vi.fn();
  vi.stubGlobal('location', { hash: '#t=ticket123', pathname: '/partner/enter', search: '', replace });
  replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  partnerGateway.exchangeTicket.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  replaceState.mockRestore();
});

const renderEnter = (opts = {}) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/partner/enter']}>
        <PartnerEnterPage />
      </MemoryRouter>
    </HelmetProvider>,
    opts,
  );

describe('partner public paths', () => {
  it('/partner/enter and /partner/ended are public to the 401 handler', () => {
    expect(isPublicPath('/partner/enter')).toBe(true);
    expect(isPublicPath('/partner/ended')).toBe(true);
  });
});

describe('partner controller', () => {
  it('stores the session, marks it managed and drops an admin "login as" session', async () => {
    localStorage.setItem('adminAuthToken', 'admin-tok');
    localStorage.setItem('adminUser', '{}');
    partnerGateway.exchangeTicket.mockResolvedValue(sessionResponse());
    const emitter = new EventEmitter();
    const opened = vi.fn();
    emitter.on(PARTNER_EVENTS.SESSION_OPENED, opened);

    await partnerController.openAccount(emitter, 'ticket123');

    expect(opened).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('authToken')).toBe('tok-managed');
    expect(JSON.parse(localStorage.getItem('user')).isManaged).toBe(true);
    expect(isManagedSession()).toBe(true);
    expect(localStorage.getItem('adminAuthToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
  });

  it('stores nothing when the link is refused', async () => {
    partnerGateway.exchangeTicket.mockRejectedValue({ status: 410, code: 'LINK_EXPIRED', message: 'x' });
    const emitter = new EventEmitter();
    const failed = vi.fn();
    emitter.on(PARTNER_EVENTS.SESSION_FAILED, failed);

    await partnerController.openAccount(emitter, 'ticket123');

    expect(failed).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(isManagedSession()).toBe(false);
  });

  it('getExistingSession is only a normal session', () => {
    expect(partnerController.getExistingSession()).toBeNull();
    localStorage.setItem('authToken', 't');
    localStorage.setItem('user', JSON.stringify({ email: 'me@example.com' }));
    expect(partnerController.getExistingSession()).toEqual({ email: 'me@example.com' });
    markManagedSession();
    expect(partnerController.getExistingSession()).toBeNull();
  });
});

describe('/partner/enter', () => {
  it('erases the ticket from the address bar, exchanges it once and opens the dashboard', async () => {
    partnerGateway.exchangeTicket.mockResolvedValue(sessionResponse());
    renderEnter();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(replaceState).toHaveBeenCalledWith(null, '', '/partner/enter');
    expect(partnerGateway.exchangeTicket).toHaveBeenCalledTimes(1);
    expect(partnerGateway.exchangeTicket).toHaveBeenCalledWith('ticket123');
  });

  it('spends the ticket only once under StrictMode', async () => {
    partnerGateway.exchangeTicket.mockResolvedValue(sessionResponse());
    render(
      <StrictMode>
        <HelmetProvider>
          <MemoryRouter><PartnerEnterPage /></MemoryRouter>
        </HelmetProvider>
      </StrictMode>,
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(partnerGateway.exchangeTicket).toHaveBeenCalledTimes(1);
  });

  it('shows the expired copy when the exchange fails', async () => {
    partnerGateway.exchangeTicket.mockRejectedValue({ status: 410, code: 'LINK_EXPIRED', message: 'x' });
    renderEnter();
    expect(await screen.findByText(PARTNER_COPY.expired.body)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows the expired copy when there is no ticket, without calling the server', async () => {
    vi.stubGlobal('location', { hash: '', pathname: '/partner/enter', search: '', replace });
    renderEnter();
    expect(await screen.findByText(PARTNER_COPY.expired.body)).toBeInTheDocument();
    expect(partnerGateway.exchangeTicket).not.toHaveBeenCalled();
  });

  describe('a normal session is already here', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'normal');
      localStorage.setItem('user', JSON.stringify({ email: 'me@example.com' }));
    });

    it('asks first, and Continue then exchanges', async () => {
      partnerGateway.exchangeTicket.mockResolvedValue(sessionResponse());
      renderEnter();
      expect(await screen.findByText(PARTNER_COPY.confirm.body('me@example.com'))).toBeInTheDocument();
      expect(partnerGateway.exchangeTicket).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: PARTNER_COPY.confirm.continue }));
      await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
      expect(partnerGateway.exchangeTicket).toHaveBeenCalledWith('ticket123');
    });

    it('Stay signed in goes to the dashboard without using the ticket', async () => {
      renderEnter();
      await userEvent.click(await screen.findByRole('button', { name: PARTNER_COPY.confirm.stay }));
      expect(replace).toHaveBeenCalledWith('/dashboard');
      expect(partnerGateway.exchangeTicket).not.toHaveBeenCalled();
      expect(localStorage.getItem('authToken')).toBe('normal');
    });
  });

  it('never names a partner or a vendor', async () => {
    partnerGateway.exchangeTicket.mockRejectedValue({ status: 410, message: 'x' });
    const { container } = renderEnter();
    await screen.findByText(PARTNER_COPY.expired.body);
    expect(JSON.stringify(PARTNER_COPY)).not.toMatch(/dexkor|unipile/i);
    expect(container.textContent).not.toMatch(/dexkor|unipile/i);
  });
});

describe('/partner/ended', () => {
  it('says the session ended, has no login form and forgets the managed marker', () => {
    markManagedSession();
    render(<HelmetProvider><PartnerEndedPage /></HelmetProvider>);
    expect(screen.getByText(PARTNER_COPY.ended.session)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
    expect(isManagedSession()).toBe(false);
  });

  it('the access variant keeps the marker (the session is still signed in)', () => {
    markManagedSession();
    render(<HelmetProvider><PartnerEndedPage reason="access" /></HelmetProvider>);
    expect(screen.getByText(PARTNER_COPY.ended.access)).toBeInTheDocument();
    expect(isManagedSession()).toBe(true);
  });
});

describe('guards for a managed session', () => {
  const at = (ui, auth, sub) =>
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthContext.Provider value={auth}>
            <SubscriptionContext.Provider value={sub || { status: null, loading: false, ready: true }}>
              <Routes>
                <Route path="/dashboard" element={ui} />
                <Route path="/login" element={<div>login page</div>} />
                <Route path="/subscribe" element={<div>subscribe page</div>} />
                <Route path="/partner/ended" element={<div>ended page</div>} />
              </Routes>
            </SubscriptionContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      </HelmetProvider>,
    );

  it('a lost managed session goes to /partner/ended, not /login', () => {
    markManagedSession();
    at(<ProtectedRoute><div>secret</div></ProtectedRoute>, anonymousAuth);
    expect(screen.getByText('ended page')).toBeInTheDocument();
  });

  it('a lost normal session still goes to /login', () => {
    at(<ProtectedRoute><div>secret</div></ProtectedRoute>, anonymousAuth);
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('an inactive managed account sees the access-ended page, never the paywall', () => {
    at(<SubscribeGate><div>secret</div></SubscribeGate>, signedInAs({ isManaged: true }),
      { status: SubscriptionSummary.fromResponse({ status: 'none' }), loading: false, ready: true });
    expect(screen.getByText(PARTNER_COPY.ended.access)).toBeInTheDocument();
    expect(screen.queryByText('subscribe page')).not.toBeInTheDocument();
  });
});

describe('User entity', () => {
  it('carries isManaged, false by default', () => {
    expect(User.fromResponse({ _id: '1', email: 'a@b.c' }).isManaged).toBe(false);
    expect(User.fromResponse({ _id: '1', email: 'a@b.c', isManaged: true }).toJSON().isManaged).toBe(true);
  });
});
