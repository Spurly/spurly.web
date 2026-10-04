/** Copy for the dashboard analytics. Numbers are always interpolated from data, never hard-coded. */
export const analyticsStrings = {
  hero: {
    eyebrow: 'Since you started using Spurly',
    day: (n) => `Day ${n.toLocaleString()} with Spurly`,
    grown: (n) => `You have grown your network by ${n.toLocaleString()} ${n === 1 ? 'connection' : 'connections'} since you started.`,
    network: (n) => `Your network is ${n.toLocaleString()} ${n === 1 ? 'connection' : 'connections'} strong.`,
    empty: 'Your numbers start with your first campaign. Everything Spurly does for you will build up here.',
    gained: 'new connections',
    networkLabel: 'Your network',
    inRange: (n, days) => `${n >= 0 ? '+' : ''}${n.toLocaleString()} in the last ${days} days`,
    invites: 'Invites sent',
    messages: 'Messages sent',
    conversations: 'Replied conversations',
  },
  tiles: {
    invites: 'Invites sent',
    newConnections: 'New connections',
    messages: 'Messages sent',
    replies: 'Replies received',
    vs: (days) => `vs previous ${days} days`,
    first: 'Nothing to compare yet',
  },
  range: (days) => `Last ${days} days`,
  activity: {
    title: 'Activity',
    empty: 'No invites, connections or replies in this range yet. Start a campaign and this fills in as it runs.',
  },
  health: {
    title: "How it's going",
    acceptance: 'Acceptance rate',
    acceptanceCaption: (matured, days) =>
      matured > 0
        ? `Of ${matured.toLocaleString()} invites sent more than ${days} days ago`
        : `Shown once invites are ${days} days old`,
    reply: 'Reply rate',
    replyCaption: (conversations) =>
      conversations > 0 ? `Of ${conversations.toLocaleString()} conversations you started` : 'Shown once you have messaged someone',
    medianReply: 'Typical time to first reply',
    medianNone: 'No replies yet',
    medianValue: (h) => (h < 1 ? 'under an hour' : h < 48 ? `about ${Math.round(h)} hours` : `about ${Math.round(h / 24)} days`),
  },
  funnel: {
    title: 'Outreach funnel',
    note: 'Each step is counted from what Spurly recorded. Conversations include ones you started yourself.',
  },
  heat: {
    title: 'Best time to send',
    sends: 'When you send',
    replies: 'When people reply',
    note: (tz) => (tz ? `Your local time (${tz})` : 'Your local time'),
  },
  campaigns: {
    title: 'Top campaigns',
    empty: 'Run a campaign and its results rank here.',
    viewAll: 'All campaigns',
    row: (sent, accepted) => `${sent.toLocaleString()} sent · ${accepted.toLocaleString()} accepted`,
  },
  audience: {
    title: 'Your network',
    where: 'Where they are',
    work: 'Where they work',
    empty: 'Appears once your connections are synced.',
  },
  error: 'Analytics could not load right now.',
  retry: 'Try again',
};
