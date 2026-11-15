/** Copy for a managed account's screens. Spurly branding only, no partner or vendor name, no billing language. */
export const PARTNER_PATHS = {
  ENDED: '/partner/ended',
  HOME: '/dashboard',
};

/** Why the ended page is showing: the session is over, or the account itself lost access. */
export const ENDED_REASONS = {
  SESSION: 'session',
  ACCESS: 'access',
};

export const PARTNER_COPY = {
  ended: {
    [ENDED_REASONS.SESSION]: 'Your session has ended. To continue, open Spurly again from the app you came from.',
    [ENDED_REASONS.ACCESS]: 'Access to this account has ended.',
  },
  notAvailable: 'This isn’t available for this account.',
  manageElsewhere: 'Manage this connection from the app you came from.',
  // The "session ended" page, for someone who set up their own sign-in.
  haveLogin: 'Have your own Spurly sign-in?',
  logIn: 'Log in',
};
