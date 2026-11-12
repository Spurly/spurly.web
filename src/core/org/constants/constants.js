/**
 * Organization sign-in and Settings -> Organization. Spurly branding only:
 * nothing here names a partner or the LinkedIn provider.
 */
export const ORG_EVENTS = {
  CODE_SENT: 'ORG_CODE_SENT',
  CODE_FAILED: 'ORG_CODE_FAILED',
  SESSION_OPENED: 'ORG_SESSION_OPENED',
  SESSION_FAILED: 'ORG_SESSION_FAILED',
  ENTER_CONFIRM_REQUIRED: 'ORG_ENTER_CONFIRM_REQUIRED',
  ORGS_LOADED: 'ORG_ORGS_LOADED',
  ORGS_FAILED: 'ORG_ORGS_FAILED',
  ACCOUNTS_LOADED: 'ORG_ACCOUNTS_LOADED',
  ACCOUNTS_FAILED: 'ORG_ACCOUNTS_FAILED',
  ACCOUNT_DISCONNECTED: 'ORG_ACCOUNT_DISCONNECTED',
  ACCOUNT_DISCONNECT_FAILED: 'ORG_ACCOUNT_DISCONNECT_FAILED',
  STATE_LOADED: 'ORG_STATE_LOADED',
  STATE_FAILED: 'ORG_STATE_FAILED',
  WORKSPACE_SET: 'ORG_WORKSPACE_SET',
  WORKSPACE_FAILED: 'ORG_WORKSPACE_FAILED',
  MEMBERS_LOADED: 'ORG_MEMBERS_LOADED',
  MEMBERS_FAILED: 'ORG_MEMBERS_FAILED',
  MEMBER_CHANGED: 'ORG_MEMBER_CHANGED',
  MEMBER_CHANGE_FAILED: 'ORG_MEMBER_CHANGE_FAILED',
};

export const ORG_PATHS = {
  LOGIN: '/login/org',
  ENTER: '/login/org/enter',
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
  sendingAs: { label: 'Sending as ', pick: 'Pick an account in "Acting as" to continue', blocked: 'Pick an account in "Acting as" first.', discardTitle: 'Switch account?', discardBody: 'Your unsaved draft is built for the current account and would be discarded.', discardConfirm: 'Switch and discard' },
  switcher: { label: 'Acting as', all: 'All accounts', unnamed: 'LinkedIn account', notUsedHere: 'This page does not use a LinkedIn account' },
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
    passwordSub: 'Enter your organization email and password.',
    passwordLabel: 'Password',
    signIn: 'Sign in',
    forgot: 'Forgot password?',
    usePassword: 'Sign in with a password instead',
    useCode: 'Sign in with an emailed code instead',
    resetTitle: 'Set a password',
    resetSubEmail: "Enter your organization's email. We'll send you a 6-digit code to set or reset your password.",
    resetSubCode: (email) => `We sent a 6-digit code to ${email} if it belongs to an organization. Enter it and choose a new password.`,
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    setPassword: 'Set password and sign in',
    savingPassword: 'Saving…',
    backToSignIn: 'Back to sign in',
    passwordRules: 'Please choose a password that meets all the requirements.',
    passwordMismatch: 'Passwords do not match.',
  },
  // "Open in Spurly": a partner's app sends a person here with a one-time link.
  enter: {
    opening: 'Opening your organization…',
    expiredTitle: 'This link has expired',
    expiredBody: 'This link has expired. Go back and click Open in Spurly again.',
    busyTitle: 'Too many attempts',
    busyBody: 'Please wait a minute, then click Open in Spurly again.',
    offlineTitle: 'Cannot reach Spurly',
    offlineBody: 'Check your connection, then go back and click Open in Spurly again.',
    confirmTitle: 'Open this organization?',
    // {email} is the person's own, already signed-in Spurly address.
    confirmBody: (email) => (email ? `You're signed in to Spurly as ${email}. Opening this organization will sign you out of it.` : "You're signed in to Spurly. Opening this organization will sign you out of it."),
    continue: 'Continue',
    stay: 'Stay signed in',
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
    connect: 'Connect LinkedIn account',
    reconnect: 'Reconnect',
    workspaceTitle: 'Workspace',
    credits: (n) => `Your organization has ${n} ${n === 1 ? 'credit' : 'credits'} left. Everyone in the organization draws from the same pool.`,
    workspaceOn: 'On. Spurly keeps your organization\'s inbox in the app.',
    workspaceOff: 'Off. Spurly stores nothing of your organization.',
    workspaceByUs: 'Spurly turns the workspace on for organizations like yours.',
    workspaceTurnOn: 'Turn on',
    workspaceTurnOff: 'Turn off',
    workspaceConfirmOff: 'Turn the workspace off?',
    workspaceConfirmOffBody: 'Spurly stops syncing your organization right away. Nothing is deleted.',
    workspaceConfirmOn: 'Turn the workspace on?',
    membersTitle: 'Members',
    membersHelp: 'Everyone here signs in with their own email and sees the same organization.',
    owner: 'Owner',
    member: 'Member',
    you: 'You',
    invited: 'Invited',
    invitePlaceholder: 'name@company.com',
    inviteSend: 'Invite',
    inviteHelp: (url) => `They sign in at ${url} with this email.`,
    remove: 'Remove',
    revoke: 'Withdraw',
    removeTitle: (name) => `Remove ${name}?`,
    removeBody: 'They lose access to this organization right away. Nothing is deleted.',
    revokeTitle: 'Withdraw this invite?',
    revokeBody: 'They will not be able to join with it.',
    workspaceConfirmOnBody: 'Spurly will keep your organization\'s inbox in the app. It is read-only: nothing is sent to LinkedIn.',
  },
  connect: {
    headings: {
      form: { title: 'Connect a LinkedIn account', sub: "Sign in with the LinkedIn account you want to add to your organization." },
      checkpoint: { title: 'Verify it’s you', sub: 'LinkedIn wants to confirm this sign-in. This is normal for a new device.' },
      success: { title: 'Account connected', sub: 'It now counts toward your organization’s connected accounts.' },
    },
    successTitle: 'LinkedIn account connected',
    successNamed: 'Connected as',
    successPlain: 'The account is now part of your organization.',
  },
};

/**
 * Navigation for an organization member (V3a.4), decided by the server (`GET /org/state`), never by
 * the browser marker alone. Settings -> Account, Organization and Billing are always there; each
 * workspace feature adds its own rows once the server says it is on (all off in V3a).
 * Every other row (Home, Discover, Network, Profile viewers, Invitations, Enrichment, Import, Posts,
 * LinkedIn) stays hidden until its module is migrated to organizations.
 */
export const ORG_NAV_ALWAYS = ['/dashboard/settings'];
export const ORG_NAV_BY_FEATURE = {
  inbox: ['/hub/inbox'],
  campaigns: ['/hub/campaigns', '/dashboard/templates'],
  // V3f: everything that sources, finds or contacts people runs through the org's accounts (the "Acting as" switcher).
  leads: ['/hub/dashboard', '/hub/leads', '/hub/discover', '/hub/network', '/hub/viewers', '/hub/invitations', '/hub/enrichment', '/dashboard/import'],
  sequences: ['/hub/sequences'],
  content: ['/hub/posts'],
};
/** Pages whose data comes from one LinkedIn account. On any other page the "Acting as" control stays put but fades. */
export const ORG_ACCOUNT_PAGES = [
  '/hub/leads', '/hub/discover', '/hub/network', '/hub/viewers', '/hub/invitations', '/hub/enrichment',
  '/hub/posts', '/hub/campaigns', '/hub/sequences', '/dashboard/import',
];
export const ORG_SETTINGS_TABS = ['account', 'organization', 'billing'];
export const ORG_STATE_NONE = { isMember: false, workspaceEnabled: false, features: { inbox: false, campaigns: false, leads: false, sequences: false, content: false } };
