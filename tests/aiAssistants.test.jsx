import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { stubGateway } from './gateway.js';

/**
 * AI assistants settings page and the OAuth consent screen, with the network stubbed at the
 * shared apiGateway. What matters: the token is shown once, the action switch is off by default
 * and saves, and consent Approve/Deny/unknown-client each end where they should.
 */
const state = { switchOn: false, consent: null, consentCalls: [] };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /api-tokens': { success: true, data: { tokens: [] } },
  'POST /api-tokens': {
    success: true,
    data: {
      token: 'spk_live_SECRETVALUE',
      apiToken: { id: 't9', name: 'Laptop', display: 'spk_live_abcd…', scopes: ['read', 'draft'], expiresAt: null, expired: false },
    },
  },
  'DELETE /api-tokens/*': { success: true, data: { apiToken: {} } },
  'GET /api-tokens/settings': () => ({ success: true, data: { mcpActionsEnabled: state.switchOn } }),
  'PUT /api-tokens/settings': () => {
    state.switchOn = true;
    return { success: true, data: { mcpActionsEnabled: true } };
  },
  'GET /oauth/connections': { success: true, data: { connections: [{ id: 'c1', name: 'Claude', scopes: ['read'], connectedAt: '2026-10-01', lastUsedAt: null }] } },
  'DELETE /oauth/connections/*': { success: true, data: { revoked: true } },
  'GET /mcp/activity': { success: true, data: { calls: [{ id: 'a1', tool: 'list_campaigns', scope: 'read', ok: true, at: '2026-10-02T10:00:00Z' }] } },
  'GET /oauth/consent-info': () => state.consent(),
  'POST /oauth/consent': (_url, body) => ({ success: true, data: { redirectTo: body.approved ? 'https://claude.ai/cb?code=abc' : 'https://claude.ai/cb?error=access_denied' } }),
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders, anonymousAuth } = await import('./helpers.jsx');
const gatewayModule = await import('src/shared/gateway/apiGateway.js');
const { AiAssistantsPage } = await import('src/products/pages/aiAssistants/index.jsx');
const { default: OAuthConsentPage } = await import('src/products/pages/aiAssistants/OAuthConsentPage.jsx');
const { default: controller } = await import('src/products/aiAssistants/controller/aiAssistantsController.js');
const { default: EventEmitter } = await import('src/shared/utils/EventEmitter.js');

beforeEach(() => {
  state.switchOn = false;
  state.consentCalls = [];
  state.consent = () => ({ success: true, data: { client: { id: 'https://claude.ai/c', name: 'Claude' }, scopes: ['read', 'draft', 'act'] } });
});

describe('AI assistants page', () => {
  it('lists connected apps and activity and shows the server address', async () => {
    renderWithProviders(<AiAssistantsPage />, { route: '/dashboard/settings/ai-assistants' });
    expect(await screen.findByText('Claude')).toBeTruthy();
    expect(await screen.findByText('list_campaigns')).toBeTruthy();
    expect(screen.getByTestId('mcp-url').textContent).toMatch(/\/mcp$/);
  });

  it('the action switch starts off and turns on when clicked', async () => {
    renderWithProviders(<AiAssistantsPage />, { route: '/dashboard/settings/ai-assistants' });
    const toggle = await screen.findByRole('switch');
    await waitFor(() => expect(toggle.disabled).toBe(false));
    expect(toggle.checked).toBe(false);
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole('switch').checked).toBe(true));
  });

  it('creating a token shows the secret once', async () => {
    renderWithProviders(<AiAssistantsPage />, { route: '/dashboard/settings/ai-assistants' });
    fireEvent.click((await screen.findAllByText('Create token'))[0]);
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('Claude Code on my laptop'), { target: { value: 'Laptop' } });
    fireEvent.click(within(dialog).getByText('Create token'));
    expect((await screen.findByTestId('token-secret')).textContent).toBe('spk_live_SECRETVALUE');
  });
});

describe('aiAssistants controller', () => {
  it('reports a failed envelope as a failure event with the server message', async () => {
    gatewayModule.default.get.mockImplementationOnce(async () => ({ data: { success: false, message: 'nope' } }));
    const emitter = new EventEmitter();
    const failed = new Promise((resolve) => emitter.once('AI_TOKENS_FAILURE', resolve));
    await controller.loadTokens(emitter);
    expect((await failed).message).toBe('nope');
  });
});

describe('OAuth consent page', () => {
  const route = '/oauth/consent?response_type=code&client_id=https%3A%2F%2Fclaude.ai%2Fc&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&scope=read+draft+act&state=s1&code_challenge=x&code_challenge_method=S256';
  let assign;
  beforeEach(() => {
    assign = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, assign }, writable: true });
  });

  it('signed out: goes to login carrying the whole request back via ?next=', async () => {
    function LoginProbe() {
      const { search } = useLocation();
      return <p data-testid="login">{decodeURIComponent(search)}</p>;
    }
    renderWithProviders(
      <Routes>
        <Route path="/oauth/consent" element={<OAuthConsentPage />} />
        <Route path="/login" element={<LoginProbe />} />
      </Routes>,
      { auth: anonymousAuth, route },
    );
    const probe = await screen.findByTestId('login');
    expect(probe.textContent).toContain('next=/oauth/consent?response_type=code');
    expect(probe.textContent).toContain('client_id=https%3A%2F%2Fclaude.ai%2Fc');
  });

  it('shows who is asking, never pre-ticks Act, and approving follows the redirect', async () => {
    renderWithProviders(<OAuthConsentPage />, { route });
    expect(await screen.findByText(/Connect Claude to Spurly/)).toBeTruthy();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes.map((b) => b.checked)).toEqual([true, true, false]);
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?code=abc'));
    const [, body] = gatewayModule.default.post.mock.calls.find(([url]) => url === '/oauth/consent');
    expect(body).toMatchObject({ approved: true, scopes: ['read', 'draft'], client_id: 'https://claude.ai/c', state: 's1' });
  });

  it('Deny redirects with the error the server built', async () => {
    renderWithProviders(<OAuthConsentPage />, { route });
    fireEvent.click(await screen.findByText('Deny'));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?error=access_denied'));
  });

  it('an invalid request shows a message, not a blank page, and does not redirect', async () => {
    state.consent = () => ({ success: false, message: 'Unknown client' });
    renderWithProviders(<OAuthConsentPage />, { route });
    expect((await screen.findByRole('alert')).textContent).toContain('Unknown client');
    expect(assign).not.toHaveBeenCalled();
  });
});
