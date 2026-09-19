/**
 * Static UI copy for the account settings page.
 *
 * STATIC only — see hub/campaigns/pages/strings.js for the scope this
 * follows across the app: no i18n library is installed, so this is one
 * reviewable place for fixed copy, not a translation layer. Numbers, balances and status text
 * built from live account/extension state stay inline where assembled.
 */
export const settingsStrings = {
  pageTitle: 'Settings',
  pageSubtitle: 'Spurly runs unattended, so the limits and the connection matter more than anything else here.',
  tabs: {
    account: 'Account',
    linkedin: 'LinkedIn',
    limits: 'Sending limits',
    ai: 'AI context',
    extension: 'Extension',
    team: 'Team',
    billing: 'Billing',
    // kept for anything still reading the old key
    profile: 'Account',
  },
  profile: {
    sectionTitle: 'Profile',
    nameLabel: 'Full name',
    companyLabel: 'Company',
    companyPlaceholder: 'Where you work',
    emailLabel: 'Work email',
    emailHint: 'Your email is used to sign in and can’t be changed here. Contact support to update it.',
    save: 'Save changes',
    saving: 'Saving…',
  },
  billing: {
    creditsTitle: 'Credits',
    creditsLabel: 'credits left',
    creditsExplain: 'One credit enriches one person with their email, phone and company details. Capturing profiles is free.',
    lowBalance: 'You’re running low — top up to keep enriching.',
    topUp: 'Top up',
    topUpComingSoon: 'Self-serve top-up is coming soon. In the meantime, contact us and we’ll add credits to your account.',
    planTitle: 'Current plan',
    creditsCaption: 'One credit enriches one person',
    invoicesTitle: 'Invoices',
    invoicesSoonTitle: 'Invoices are coming here',
    invoicesSoonHint: 'Every charge and top-up, with a PDF to download. Until then, receipts arrive by email.',
    planSuffix: 'plan',
    planFreeDescription: 'Everything you need to try Spurly, with a monthly credit allowance.',
    planPaidDescription: 'Thanks for being a paying customer.',
  },
  notifications: {
    sectionTitle: 'Notifications',
    items: [
      { title: 'Reply alerts', hint: 'A push the moment someone answers, because a warm thread cools fast.', on: true },
      { title: 'Daily send summary', hint: 'What went out, what came back, and what the cap stopped.', on: false },
      { title: 'Failure alerts', hint: 'Enrichment failures and connection problems, as they happen.', on: true },
    ],
  },
  limits: {
    capTitle: 'Daily invite cap',
    capHint: 'LinkedIn throttles most accounts above roughly 30 a day, so Spurly stops before that, not after. Every campaign and sequence shares this one cap.',
    windowTitle: 'Sending window',
    rules: [
      { title: 'Stop a person the moment they reply', hint: 'A reply removes them from every remaining step in every sequence.', on: true },
      { title: 'Skip anyone contacted in the last 30 days', hint: 'Applies across campaigns, so two sequences never double up on one person.', on: true },
      { title: 'Pause everything if LinkedIn warns', hint: 'Spurly stops the account entirely rather than risking a restriction.', on: false },
    ],
  },
  team: {
    membersTitle: 'Members',
    soonTitle: 'Invite your team — coming soon',
    soonHint: 'Seats, roles and a shared daily cap per LinkedIn account. Spurly is single-seat today.',
  },
  extension: {
    sectionTitle: 'Chrome extension',
    recheck: 'Recheck',
    defaultCaption: 'Spurly captures profiles directly from LinkedIn.',
    notInstalledBody: 'Spurly can’t capture profiles or send outreach without the extension. Install it to get started.',
    installLink: 'Install the extension',
    installUrl: 'https://chromewebstore.google.com/',
    notSignedInBody: 'The extension is installed but couldn’t pick up this browser’s session. Reload this page to hand it over again. If it stays signed out, open the extension on LinkedIn and sign in with this account.',
    status: {
      checking: 'Checking…',
      notInstalled: 'Not installed',
      notResponding: 'Installed — not responding',
      notSignedIn: 'Installed — not signed in',
      connected: 'Connected',
    },
  },
  serverSending: {
    sectionTitle: 'Send without the extension',
    title: 'LinkedIn account',
    body: 'Send on a schedule, with your browser closed.',
    manage: 'Manage',
  },
  aiContext: {
    sectionTitle: 'Context for Spurly',
    intro: 'Spurly uses this whenever it writes a connection note or message for you. Fill in what you can — everything is optional, but the more you give it, the less generic the writing. Nothing here is ever sent to the people you contact.',
    defaultToneLabel: 'Default tone',
    defaultToneHint: 'You can still pick a different tone for any single message.',
    save: 'Save context',
    saving: 'Saving…',
    loading: 'Loading…',
    previewTitle: 'What the AI sees',
    previewEmpty: 'Nothing yet. Until you fill something in, Spurly writes from a blank slate — correct English, but it can’t say anything true about you.',
  },
};
