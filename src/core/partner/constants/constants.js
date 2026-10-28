/**
 * "Open in Spurly": a partner's app sends a person here with a one-time link.
 * Everything a managed user can read lives in this file's copy — Spurly
 * branding only, no partner or vendor name, no billing language.
 */
export const PARTNER_EVENTS = {
  SESSION_OPENED: 'PARTNER_SESSION_OPENED',
  SESSION_FAILED: 'PARTNER_SESSION_FAILED',
  CONFIRM_REQUIRED: 'PARTNER_CONFIRM_REQUIRED',
};

export const PARTNER_PATHS = {
  ENTER: '/partner/enter',
  ENDED: '/partner/ended',
  HOME: '/dashboard',
};

/** Why the ended page is showing: the session is over, or the account itself lost access. */
export const ENDED_REASONS = {
  SESSION: 'session',
  ACCESS: 'access',
};

export const PARTNER_COPY = {
  opening: 'Opening your account…',
  expired: {
    title: 'This link has expired',
    body: 'This link has expired. Go back and click Open in Spurly again.',
  },
  confirm: {
    title: 'Open this account?',
    // {email} is the person's own, already signed-in Spurly address.
    body: (email) => `You're signed in to Spurly as ${email}. Opening this account will sign you out of it.`,
    continue: 'Continue',
    stay: 'Stay signed in',
  },
  ended: {
    [ENDED_REASONS.SESSION]: 'Your session has ended. To continue, open Spurly again from the app you came from.',
    [ENDED_REASONS.ACCESS]: 'Access to this account has ended.',
  },
  notAvailable: 'This isn’t available for this account.',
  manageElsewhere: 'Manage this connection from the app you came from.',
  // A managed account with a direct login may reconnect its own LinkedIn profile here.
  reconnectOnly: 'You can reconnect this account\'s LinkedIn profile here. To change or remove it, use the app you came from.',
  // The "session ended" page, for someone who set up their own sign-in.
  haveLogin: 'Have your own Spurly sign-in?',
  logIn: 'Log in',
};
