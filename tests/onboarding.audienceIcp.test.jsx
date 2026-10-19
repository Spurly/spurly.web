import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { stubGateway } from './gateway.js';

/**
 * The audience step reads the ICP saved on the profile step and seeds ONE field
 * from it: the job title. Not industry/location/company -- those need LinkedIn's
 * own ids, which the tag pickers resolve from a keystroke, and typed text sent
 * there would be a silently-wrong guess. A failed read leaves the field blank.
 */
const state = { icp: null, profileFails: false };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/account': { success: true, data: { account: { connected: true, status: 'OK' } } },
  'GET /hub/account/profile': async () => {
    if (state.profileFails) throw { success: false, message: 'boom' };
    return { success: true, data: { profile: { connected: true, snapshot: null, icp: state.icp } } };
  },
  'GET /credits*': { success: true, data: { balance: 100 } },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders, signedInAs } = await import('./helpers.jsx');
const { default: OnboardingAudiencePage } = await import('src/core/pages/auth/OnboardingAudiencePage.jsx');

const icp = (roles) => ({ roles, industries: [], locations: [], companySizes: [], notes: '' });
const titleField = () => screen.findByLabelText('Title contains');

beforeEach(() => {
  state.icp = icp([]);
  state.profileFails = false;
});

describe('OnboardingAudiencePage -- ICP prefill', () => {
  it('seeds the job title from the first saved role', async () => {
    state.icp = icp(['Head of Growth', 'VP Sales']);
    renderWithProviders(<OnboardingAudiencePage />, { auth: { ...signedInAs(), setOnboardingStage: vi.fn() } });
    expect(await titleField()).toHaveValue('Head of Growth');
  });

  it('leaves the title blank when no ICP was saved', async () => {
    renderWithProviders(<OnboardingAudiencePage />, { auth: { ...signedInAs(), setOnboardingStage: vi.fn() } });
    expect(await titleField()).toHaveValue('');
  });

  it('a failed profile read does not block the form', async () => {
    state.profileFails = true;
    renderWithProviders(<OnboardingAudiencePage />, { auth: { ...signedInAs(), setOnboardingStage: vi.fn() } });
    expect(await titleField()).toHaveValue('');
  });
});
