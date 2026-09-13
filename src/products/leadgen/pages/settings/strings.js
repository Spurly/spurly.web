/**
 * Static UI copy for the leadgen settings page (all four tabs).
 *
 * STATIC only — see hub/campaigns/pages/strings.js for the scope this
 * follows across the app: no i18n library is installed, so this is one
 * reviewable place for fixed copy, not a translation layer. Per-field help
 * text for the AI context tab stays in personalization's CONTEXT_FIELDS
 * (it's paired data, not flat copy); numbers, balances and status text
 * built from live account/extension state stay inline where assembled.
 */
export const settingsStrings = {
  pageTitle: 'Settings',
  pageSubtitle: 'Manage your account, credits and extension.',
  tabs: {
    profile: 'Profile',
    ai: 'AI context',
    billing: 'Billing & credits',
    extension: 'Extension',
  },
  profile: {
    sectionTitle: 'Your details',
    nameLabel: 'Full name',
    companyLabel: 'Company',
    companyPlaceholder: 'Where you work',
    emailLabel: 'Email',
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
    planTitle: 'Plan',
    planSuffix: 'plan',
    planFreeDescription: 'Everything you need to try Spurly, with a monthly credit allowance.',
    planPaidDescription: 'Thanks for being a paying customer.',
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
