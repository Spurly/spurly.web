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
