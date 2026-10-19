import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { stubGateway } from './gateway.js';

/**
 * Onboarding step 4, "Is this you?". What is worth pinning:
 *  - the slow first read: the page waits, polls, and shows the profile when it
 *    lands -- it is never a dead end if the read is slow or fails
 *  - nothing is pre-selected in the ICP; suggestions are offered, not applied
 *  - the ICP is saved before moving on, an empty one is not sent at all, and a
 *    failed save keeps the user here instead of losing what they typed
 *  - Skip and Continue both advance the stage to 'audience'
 *
 * Shapes are the server's own response (GET /hub/account/profile).
 */
vi.mock('src/products/settings/constants/constants.js', async (importOriginal) => ({
  ...(await importOriginal()),
  PROFILE_POLL_INTERVAL_MS: 10,
}));

const state = { profile: null, queue: [], saved: [], saveFails: false, refreshes: 0, refreshResponse: null };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/account/profile': {
    success: true,
    get data() { return { profile: state.queue.length ? state.queue.shift() : state.profile }; },
  },
  'POST /hub/account/profile/refresh': async () => {
    state.refreshes += 1;
    return { success: true, data: { profile: state.refreshResponse ?? state.profile } };
  },
  'PUT /hub/account/profile/icp': async (url, body) => {
    if (state.saveFails) throw { success: false, message: 'Pick at most 10 roles' };
    state.saved.push(body);
    return { success: true, data: { icp: body } };
  },
  'GET /credits*': { success: true, data: { balance: 100 } },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders, signedInAs } = await import('./helpers.jsx');
const { default: OnboardingProfilePage } = await import('src/products/settings/components/profileReview/OnboardingProfilePage.jsx');

const snapshot = () => ({
  name: 'Alex Sample',
  headline: 'Founder at Example Co',
  summary: 'I build outbound tools for small teams.',
  location: 'Pune, Maharashtra, India',
  profileUrl: 'https://www.linkedin.com/in/alex-sample',
  followerCount: 1234,
  connectionsCount: 500,
  flags: { creator: true, influencer: false, premium: true, openProfile: false },
  currentRoles: [{ company: 'Example Co', position: 'Founder' }],
  experience: [
    { company: 'Example Co', position: 'Founder', start: '1/1/2021', end: '', current: true },
    { company: 'Old Co', position: 'Engineer', start: '1/1/2016', end: '1/1/2020', current: false },
  ],
  education: [{ school: 'Sample University', degree: 'BTech', field: 'Computer Science', start: '2012', end: '2016' }],
  skills: ['Sales', 'Outbound'],
  languages: [],
  certifications: [],
  totals: { experience: 2, education: 1, skills: 2 },
});

const view = (overrides = {}) => ({
  connected: true,
  checking: false,
  snapshot: snapshot(),
  checkedAt: new Date().toISOString(),
  error: '',
  profile: { name: 'Alex Sample', pictureUrl: '' },
  suggestions: { roles: ['Founder'], locations: ['Pune, Maharashtra, India', 'India'], industries: [], companySizes: [] },
  icp: { roles: [], industries: [], locations: [], companySizes: [], notes: '', updatedAt: null },
  ...overrides,
});

let setOnboardingStage;
function renderPage() {
  const auth = { ...signedInAs(), setOnboardingStage };
  return renderWithProviders(
    <Routes>
      <Route path="/onboarding/profile" element={<OnboardingProfilePage />} />
      <Route path="/onboarding/audience" element={<div>audience step</div>} />
      <Route path="/onboarding/linkedin" element={<div>linkedin step</div>} />
    </Routes>,
    { auth, route: '/onboarding/profile' },
  );
}

beforeEach(() => {
  Object.assign(state, { profile: view(), queue: [], saved: [], saveFails: false, refreshes: 0, refreshResponse: null });
  setOnboardingStage = vi.fn();
});

describe('OnboardingProfilePage -- showing the profile', () => {
  it('shows what LinkedIn holds about the user', async () => {
    renderPage();
    expect(await screen.findByText('Alex Sample')).toBeInTheDocument();
    expect(screen.getByText('Founder at Example Co')).toBeInTheDocument();
    expect(screen.getByText('Pune, Maharashtra, India')).toBeInTheDocument();
    expect(screen.getByText('I build outbound tools for small teams.')).toBeInTheDocument();
    expect(screen.getByText('Sample University')).toBeInTheDocument();
    expect(screen.getByText('Outbound')).toBeInTheDocument();
    // years, not raw "1/1/2021" strings
    expect(screen.getByText(/2021 – Present/)).toBeInTheDocument();
    expect(screen.getByText(/2016 – 2020/)).toBeInTheDocument();
  });

  it('a section LinkedIn gave nothing for is hidden, not shown empty', async () => {
    state.profile = view({ snapshot: { ...snapshot(), skills: [], education: [], summary: '' } });
    renderPage();
    await screen.findByText('Alex Sample');
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Education')).not.toBeInTheDocument();
    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('waits through the slow first read, then shows the profile', async () => {
    state.queue = [view({ checking: true, snapshot: null }), view({ checking: true, snapshot: null })];
    renderPage();
    expect(await screen.findByText(/Reading your LinkedIn profile/)).toBeInTheDocument();
    // Continue waits for the profile; Skip never does.
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /skip for now/i })).toBeEnabled();
    expect(await screen.findByText('Alex Sample')).toBeInTheDocument();
    expect(screen.queryByText(/Reading your LinkedIn profile/)).not.toBeInTheDocument();
  });
});

describe('OnboardingProfilePage -- never a dead end', () => {
  it('LinkedIn not connected -> a way back to connect it', async () => {
    state.profile = view({ connected: false, snapshot: null });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /connect linkedin/i }));
    expect(await screen.findByText('linkedin step')).toBeInTheDocument();
  });

  it('a failed read says so, offers Try again, and still lets the user carry on', async () => {
    state.profile = view({ snapshot: null, error: 'vendor timeout' });
    state.refreshResponse = view();
    renderPage();
    expect(await screen.findByText(/couldn.t read your profile/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Alex Sample')).toBeInTheDocument();
    expect(state.refreshes).toBe(1);
  });

  it('can continue without a profile at all', async () => {
    state.profile = view({ snapshot: null, error: 'vendor timeout' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /^continue/i }));
    expect(await screen.findByText('audience step')).toBeInTheDocument();
    expect(setOnboardingStage).toHaveBeenCalledWith('audience');
  });
});

describe('OnboardingProfilePage -- who do you want to reach', () => {
  it('pre-selects nothing; suggestions are offered, and tapping one adds it', async () => {
    renderPage();
    await screen.findByText('Alex Sample');
    expect(screen.queryByRole('button', { name: /remove founder/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\+ Founder/ }));
    expect(await screen.findByRole('button', { name: /remove founder/i })).toBeInTheDocument();
    // an accepted suggestion is no longer offered
    expect(screen.queryByRole('button', { name: /\+ Founder/ })).not.toBeInTheDocument();
  });

  it('saves what was entered, then moves to the audience step', async () => {
    renderPage();
    await screen.findByText('Alex Sample');

    const titles = screen.getByLabelText('Job titles');
    fireEvent.change(titles, { target: { value: 'Head of Growth' } });
    fireEvent.keyDown(titles, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /11-50 employees/ }));
    fireEvent.click(screen.getByRole('button', { name: /yes, that.s me/i }));

    expect(await screen.findByText('audience step')).toBeInTheDocument();
    expect(state.saved).toHaveLength(1);
    expect(state.saved[0]).toMatchObject({ roles: ['Head of Growth'], companySizes: ['11-50'] });
    expect(setOnboardingStage).toHaveBeenCalledWith('audience');
  });

  it('an untouched ICP is not sent at all', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /yes, that.s me/i }));
    expect(await screen.findByText('audience step')).toBeInTheDocument();
    expect(state.saved).toHaveLength(0);
  });

  it('a failed save keeps the user here with what they typed', async () => {
    state.saveFails = true;
    renderPage();
    await screen.findByText('Alex Sample');
    const titles = screen.getByLabelText('Job titles');
    fireEvent.change(titles, { target: { value: 'CTO' } });
    fireEvent.keyDown(titles, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /yes, that.s me/i }));

    await waitFor(() => expect(screen.getByText('Pick at most 10 roles')).toBeInTheDocument());
    expect(screen.queryByText('audience step')).not.toBeInTheDocument();
    expect(setOnboardingStage).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /remove cto/i })).toBeInTheDocument();
  });

  it('Skip advances without saving', async () => {
    renderPage();
    const titles = (await screen.findByLabelText('Job titles'));
    fireEvent.change(titles, { target: { value: 'CTO' } });
    fireEvent.keyDown(titles, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));
    expect(await screen.findByText('audience step')).toBeInTheDocument();
    expect(state.saved).toHaveLength(0);
    expect(setOnboardingStage).toHaveBeenCalledWith('audience');
  });

  it('a saved ICP is what the draft starts from', async () => {
    state.profile = view({ icp: { roles: ['VP Sales'], industries: [], locations: [], companySizes: ['51-200'], notes: '', updatedAt: null } });
    renderPage();
    expect(await screen.findByRole('button', { name: /remove vp sales/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /51-200 employees/ })).toBeInTheDocument();
  });
});
