import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { postAuthDestination } from 'src/platform/auth/postAuthDestination.js';
import InstallExtensionPage from 'src/platform/auth/InstallExtensionPage.jsx';

/**
 * Both halves of "you can always get back to the app".
 *
 * /onboarding forwards a finished user to /onboarding/install, and that page
 * only leaves under its own steam once it has seen the extension. So anything
 * that sent a returning user to /onboarding — a status refresh, a renewal
 * payment — stranded them. postAuthDestination picks the right target; the
 * install page's arrival check is the backstop for whatever still lands there.
 */
describe('postAuthDestination', () => {
  it('sends an account that has not finished onboarding to the survey', () => {
    expect(postAuthDestination({ onboardingComplete: false })).toBe('/onboarding');
  });

  it('sends a finished account to the dashboard', () => {
    expect(postAuthDestination({ onboardingComplete: true })).toBe('/dashboard');
  });

  it('errs towards the dashboard when the flag is missing', () => {
    // The recoverable direction: the dashboard has navigation, the install
    // page does not.
    expect(postAuthDestination({})).toBe('/dashboard');
    expect(postAuthDestination(null)).toBe('/dashboard');
  });
});

function renderInstallPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={['/onboarding/install']}
    >
      <Routes>
        <Route path="/onboarding/install" element={<InstallExtensionPage />} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InstallExtensionPage', () => {
  afterEach(() => {
    delete globalThis.chrome;
    vi.restoreAllMocks();
  });

  it('forwards to the dashboard when the extension already answers', async () => {
    globalThis.chrome = {
      runtime: {
        lastError: undefined,
        sendMessage: (_id, _msg, cb) => cb({ ok: true }),
      },
    };

    renderInstallPage();
    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument());
  });

  it('stays put, showing the install CTA, when there is no extension', async () => {
    // No `chrome` at all — Firefox, or Chrome without the extension.
    renderInstallPage();

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /install the.*chrome extension/i })).toBeInTheDocument());
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
    // The arrival check must not flip the page into its "detecting" state:
    // the CTA that actually opens the Web Store has to still be there.
    expect(screen.getByRole('button', { name: /add spurly to chrome/i })).toBeInTheDocument();
  });
});
