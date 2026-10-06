/**
 * Static UI copy for the LinkedIn settings page.
 *
 * STATIC only — see hub/campaigns/pages/strings.js for the scope this
 * follows across the app: no i18n library is installed, so this is one
 * reviewable place for fixed copy, not a translation layer. Toast and
 * confirm-dialog text stay in useLinkedInSettings.js, where the rest of
 * that call's logic already lives — same call made for the delete/remove
 * confirmations in campaigns, leads, and sequences.
 */
export const linkedInSettingsStrings = {
  pageTitle: 'LinkedIn',
  pageSubtitle: 'Let Spurly send from your LinkedIn account, without the extension.',
  sectionTitle: 'LinkedIn account',
  notConnected: {
    title: 'Not connected',
    body: 'Connect once and Spurly can send on a schedule, with your laptop closed.',
    // Copy depends on the connect flow, because the two make different promises.
    authNoteBefore: 'You sign in with your LinkedIn email and password, and verify it’s you if LinkedIn asks. ',
    authNoteBold: 'Spurly never stores your password.',
    hostedAuthNoteBefore: 'You sign in on LinkedIn’s own page through our provider. ',
    hostedAuthNoteBold: 'Spurly never sees or stores your password.',
    connect: 'Connect LinkedIn',
    connecting: 'Opening…',
    checkAgain: 'Already connected? Check again',
    checking: 'Checking…',
  },
  connected: {
    refresh: 'Refresh',
    reconnect: 'Reconnect',
    reconnecting: 'Opening…',
    disconnect: 'Disconnect',
  },
  accountHealth: {
    title: 'Account health',
    refresh: 'Refresh',
    refreshing: 'Checking…',
    checkedJust: 'Checked just now',
    checkedAgo: (when) => `Checked ${when} ago`,
    checking: 'Reading your LinkedIn account…',
    gaveUp: 'This is taking longer than usual. Try Refresh in a moment.',
    failed: 'We could not read your LinkedIn account details. Try Refresh.',
    partialError: 'Some details could not be read last time. Try Refresh.',
    plan: 'Plan',
    premium: 'LinkedIn Premium',
    salesNavigator: 'Sales Navigator',
    recruiter: 'Recruiter',
    companyPages: 'Company pages',
    inmail: 'InMail credits',
    states: { yes: 'Active', no: 'Not on this account', unknown: 'Unknown' },
    noCompanyPages: 'None',
    pools: { premium: 'Premium', recruiter: 'Recruiter', salesNavigator: 'Sales Navigator' },
    inmailNotReported: 'LinkedIn did not report a balance',
    openProfile: 'Open profile',
  },
  freeAccountNotice: {
    title: 'Personalised invites',
    paragraph1: 'Your LinkedIn account is on the free plan, so connection requests will be sent without a note. LinkedIn limits free accounts to a few personalised invites each month and then silently drops the note — turning it off is the only way to be sure what your prospects actually receive.',
    paragraph2: 'LinkedIn Premium removes the limit, and Spurly enables notes automatically once it sees one.',
  },
};
