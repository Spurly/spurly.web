/**
 * Static copy for the Home dashboard. Live figures are assembled inline.
 */
export const dashboardStrings = {
  pageTitle: 'Home',
  pageSubtitle: 'Spurly keeps working while you are away. Here is what changed, and what is worth your attention today.',
  newAudience: 'New audience',
  metrics: {
    leadsSourced: 'Leads sourced',
    invitesToday: 'Invites sent today',
    connectRate: 'Connect rate',
    repliesWaiting: 'Replies waiting',
  },
  claude: {
    eyebrow: 'Works with Claude',
    title: 'Run Spurly from Claude',
    body: 'Connect Spurly to Claude and ask in plain language. Review your numbers, triage replies and draft campaigns from a chat. Sending stays off until you allow it.',
    connect: 'Connect with Claude',
    copy: 'Copy server address',
    copied: 'Copied',
    guide: 'Setup guide',
    chatLabel: 'Example conversation with Claude using Spurly',
    connected: 'Spurly connected',
    replies: [
      'Your acceptance rate is up on last week, and 3 replies are waiting on you. Want me to draft answers?',
      'Two are asking about pricing. I can draft replies for you to approve. Nothing is sent without your say-so.',
    ],
  },
  attention: {
    title: 'Worth your attention',
    allCaughtUpTitle: "You're caught up",
    allCaughtUpHint: 'No enrichment failures in the last day, nothing unread, and nothing paused.',
    enrichmentFailedTitle: (n) => `${n} enrichment${n === 1 ? '' : 's'} failed in the last 24 hours`,
    enrichmentFailedHint: 'Re-queueing costs nothing — see which leads hit an error.',
    enrichmentFailedCta: 'Retry',
    repliesWaitingTitle: (n) => `${n} repl${n === 1 ? 'y' : 'ies'} waiting in your inbox`,
    repliesWaitingHint: 'Unread conversations. Every one of them already answered you.',
    repliesWaitingCta: 'Open',
    pausedTitle: (name) => `${name} is paused`,
    pausedCta: 'Resume',
  },
  topList: {
    title: 'Top of the list',
    hint: 'Newest leads for now — ranked by fit once scoring ships.',
    allLeads: 'All leads',
    empty: 'No leads yet. Start an audience and they appear here.',
  },
  campaigns: {
    title: 'Campaigns running',
    viewAll: 'Manage',
    emptyTitle: 'No campaigns running',
    emptyHint: 'Start one from an audience on the Leads page.',
  },
  activity: {
    title: 'Recently',
    empty: 'Nothing has happened yet. Activity shows up here as Spurly works.',
  },
};
