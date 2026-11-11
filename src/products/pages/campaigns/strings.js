/**
 * Static UI copy for both campaigns pages (list + detail).
 *
 * STATIC only — no i18n library is installed in this app yet, so this exists
 * to give user-facing copy one place to be read and reviewed, not to feed a
 * translation layer. Copy built from live data (the subtitle's people/invited
 * counts, toast messages built from a request's result, the pacing banner's
 * numbers) stays inline where it's assembled — a flat string constant can't
 * hold a template, and turning every one of those into a tiny function here
 * would be indirection with no reader.
 */
export const campaignsStrings = {
  list: {
    pageTitle: 'Campaigns',
    pageSubtitle: 'Each campaign pairs an audience with what to send, and runs at a human pace. Spurly reports what it did, not what it might do.',
    newCampaign: 'New campaign',
    sectionTitle: 'Campaigns',
    loading: 'Loading…',
    emptyTitle: 'No campaigns yet',
    emptyHint: 'Campaigns are built from your leads. Pick the people you want to reach, then create one from the selection.',
    goToLeads: 'Go to leads',
  },
  detail: {
    loadingPageTitle: 'Campaign',
    loading: 'Loading…',
    notFound: 'That campaign is not here.',
    backToCampaigns: 'Back to campaigns',
    allCampaigns: 'All campaigns',
    messageSectionTitle: 'Message',
    retryFailed: 'Retry failed',
    pause: 'Pause',
    resume: 'Resume',
    startSending: 'Start sending',
    senderColumn: 'Sent from',
  },
  senders: {
    heading: 'Sending accounts',
    health: { active: 'Active', paused: 'Paused', 'needs-attention': 'Needs attention', removed: 'Removed' },
    sendingNow: 'Sending now',
    waiting: 'Waiting',
    queued: (n) => `${n.toLocaleString()} queued`,
    sent: (n) => `${n.toLocaleString()} sent`,
    usage: (day, cap) => `${day} of ${cap} today`,
    rebalance: 'Move waiting people',
    rebalanceTitle: 'Hand people who are still waiting on a paused or removed account to the accounts that can send',
    rebalanceBusy: 'Moving…',
    rebalanced: (moved, left) => `${moved} moved${left ? `, ${left} could not be moved` : ''}.`,
    rebalanceNone: 'Nobody could be moved right now.',
    pauseFirst: 'Pause it first, then move the waiting people.',
    /** Why one account stopped, in a sentence with the next step. */
    pausedReasons: {
      breaker: 'Paused after repeated failures. Check the account, then start again.',
      account: 'This account needs to be reconnected in Settings.',
      'sender-removed': 'This account was removed. People waiting on it can be moved to the others.',
      'workspace-off': 'Sending is switched off for your organization.',
    },
    pausedFallback: 'Paused.',
    removedSkip: 'Skipped: the account that would send was removed',
  },
  /** The "who sends" choice in the Start dialog. */
  start: {
    whoLabel: 'Sent from',
    whoOne: 'One account',
    whoOneNamed: (name) => `Only ${name}`,
    whoSeveral: 'Several accounts',
    severalHintConnect: 'Each account you tick sends to the people it is not yet connected to, under its own limits. An account already connected to someone skips them, and the table says why.',
    severalHintMessage: 'Each account you tick messages the people it is connected to, under its own limits. An account not connected to someone skips them, and the table says why.',
  },
  pool: {
    open: 'Use several accounts…',
    openTitle: 'Send one campaign from several LinkedIn accounts, each lead from one account',
    whoTitle: 'Which account sends this?',
    whoDescription: 'Send from one LinkedIn account, or from several together. With several, each person is contacted from exactly one of them and every account keeps its own limits.',
    whoLabel: 'Sent from',
    whoOne: 'One account',
    whoSeveral: 'Several accounts',
    oneAccountLabel: 'Account',
    title: 'Send from several accounts',
    description: 'Every person is contacted from exactly one of the accounts you tick, and each account keeps its own limits.',
    accountsLabel: 'Accounts',
    noAccounts: 'Connect at least two LinkedIn accounts to send from several together.',
    typeLabel: 'What to send',
    typeConnect: 'Connection requests',
    typeMessage: 'Messages (1st-degree connections)',
    previewButton: 'Preview the split',
    previewing: 'Working out who would send to whom…',
    previewEmpty: 'Nobody in this selection can be sent to from these accounts yet. See the reasons below.',
    previewError: 'We could not work out the split just now. Nothing was created. Please try again.',
    total: (n) => `${n.toLocaleString()} ${n === 1 ? 'person' : 'people'} will be contacted`,
    perAccount: (name, n) => `${name || 'An account'}: ${n.toLocaleString()}`,
    alreadyConnected: (n) => `${n.toLocaleString()} already connected, nothing to send`,
    otherAccount: (n) => `${n.toLocaleString()} not in these accounts' lists`,
    create: 'Create campaign',
    creating: 'Creating…',
    createFailed: 'Could not create that campaign. Nothing was sent.',
    cancel: 'Cancel',
    needSelection: 'Select some leads first.',
    refusedHeading: 'Left out',
  },
  /** One sentence per reason a person is left out of a pool, with the next step. Never an error code. */
  refusals: {
    'held-by-other-account': 'Already in another campaign or sequence run by a different account. Finish or remove it there first.',
    'not-connected': 'Not a 1st-degree connection of the ticked accounts, so a message cannot be sent. Use a connection request first.',
    'already-connected': 'Already connected to one of your accounts, so no request is needed.',
    'no-usable-sender': 'None of the ticked accounts can send right now. Reconnect them in Settings, then preview again.',
    'degree-unknown': 'We do not know yet how this person is linked to the accounts. Refresh the network and try again.',
    'invited-by-other-account': 'Another of your accounts already invited this person. Wait for the answer, or withdraw it there.',
    'connected-to-other-account': 'Connected to an account that is not ticked. Add that account, or message them from it.',
  },
  /** Fallback copy for any code or reason we do not list: still a sentence with a next step. */
  fallbackRefusal: 'These people cannot be sent to from the ticked accounts right now. Try different accounts.',
  errors: {
    ACCOUNTS_REQUIRED: 'Choose at least two accounts to send from.',
    NO_LEADS_SELECTED: 'Select some leads first.',
    PAUSE_FIRST: 'Pause it first, then move the waiting people.',
    SENDER_POOL_TOO_LARGE: 'You can use up to 10 accounts at once. Choose fewer and try again.',
    ACCOUNT_SELECTION_CONFLICT: 'Choose either one account or a list of accounts, not both.',
    ACCOUNT_NOT_FOUND: 'One of the selected accounts is no longer part of your organization. Refresh the page and choose again.',
    LINKEDIN_ACCOUNT_NOT_READY: 'One of the selected accounts needs to be reconnected before it can send. Reconnect it, or leave it out.',
    NO_USABLE_SENDER: 'None of the accounts can send right now. Reconnect one in Settings, then try again.',
    NOT_A_POOL: 'This one sends from a single account, so there is nothing to rebalance.',
    WORKSPACE_FEATURE_OFF: 'Your organization has not turned this on yet. Ask an admin to enable it.',
    fallback: 'Something went wrong. Nothing was changed. Please try again.',
  },
};
