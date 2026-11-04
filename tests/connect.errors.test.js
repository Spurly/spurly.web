import { describe, it, expect } from 'vitest';
import { toConnectError } from 'src/products/settings/hooks/useLinkedInConnect.js';
import { CONNECT_ERROR_TITLES } from 'src/products/settings/constants/constants.js';

/** The two sign-in limits read differently: ours (with minutes) and LinkedIn's. */
describe('connect limit errors', () => {
  it('shows the server sentence under its own title for our limit', () => {
    const message = "You've reached the limit of 5 sign-in attempts per hour for your organization. This protects your LinkedIn accounts from being flagged. You can try again in 12 minutes.";
    const out = toConnectError({ message, data: { code: 'ORG_CONNECT_LIMIT', retryAfterSeconds: 700 } });
    expect(out).toMatchObject({ code: 'ORG_CONNECT_LIMIT', title: CONNECT_ERROR_TITLES.ORG_CONNECT_LIMIT, message });
    expect(out.title).toBe('Sign-in limit reached');
  });

  it("shows LinkedIn's pause under a different title", () => {
    const message = 'LinkedIn is asking for a pause on sign-in attempts for this account. Wait a few minutes, then try again.';
    const out = toConnectError({ message, data: { code: 'LINKEDIN_RATE_LIMITED' } });
    expect(out.title).toBe('LinkedIn asked for a pause');
    expect(out.message).toBe(message);
  });
});
