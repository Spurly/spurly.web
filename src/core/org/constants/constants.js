/**
 * Organization sign-in and Settings -> Organization. Spurly branding only:
 * nothing here names a partner or the LinkedIn provider.
 */
export const ORG_EVENTS = {
  CODE_SENT: 'ORG_CODE_SENT',
  CODE_FAILED: 'ORG_CODE_FAILED',
  SESSION_OPENED: 'ORG_SESSION_OPENED',
  SESSION_FAILED: 'ORG_SESSION_FAILED',
  ORGS_LOADED: 'ORG_ORGS_LOADED',
  ORGS_FAILED: 'ORG_ORGS_FAILED',
  ACCOUNTS_LOADED: 'ORG_ACCOUNTS_LOADED',
  ACCOUNTS_FAILED: 'ORG_ACCOUNTS_FAILED',
  ACCOUNT_DISCONNECTED: 'ORG_ACCOUNT_DISCONNECTED',
  ACCOUNT_DISCONNECT_FAILED: 'ORG_ACCOUNT_DISCONNECT_FAILED',
};

export const ORG_PATHS = {
  LOGIN: '/login/org',
  SETTINGS: '/dashboard/settings?tab=organization',
};

export const ORG_CODE_LENGTH = 6;

export const ORG_ACCOUNT_LABEL = {
  OK: 'Connected',
  CONNECTING: 'Connecting',
  CREDENTIALS: 'Needs reconnect',
  STOPPED: 'Stopped',
  DELETED: 'Disconnected',
};

export const ORG_ACCOUNT_TONE = {
  OK: 'success',
  CONNECTING: 'info',
  CREDENTIALS: 'warning',
  STOPPED: 'warning',
  DELETED: 'neutral',
};

export const ORG_COPY = {
  login: {
    title: 'Sign in to your organization',
    subEmail: "Enter your organization's email. We'll send you a 6-digit code.",
    subCode: (email) => `We sent a 6-digit code to ${email} if it belongs to an organization. Enter it below.`,
    sendCode: 'Send code',
    sending: 'Sending…',
    verify: 'Sign in',
    verifying: 'Signing in…',
    useDifferentEmail: 'Use a different email',
    personal: 'Have a personal Spurly account?',
    personalLink: 'Sign in here',
  },
  tab: {
    title: 'Organization',
    connected: 'Connected now',
    peak: '30-day peak',
    distinct: 'Distinct, 30 days',
    accountsTitle: 'LinkedIn accounts',
    empty: 'No LinkedIn accounts are connected yet.',
    disconnect: 'Disconnect',
    suspended: 'This organization is suspended.',
    confirmTitle: (name) => `Disconnect ${name}?`,
    confirmBody: 'Spurly stops working with this LinkedIn account. It can be connected again later.',
  },
};
