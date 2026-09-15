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
    pageSubtitle: 'Connection requests and messages, sent from our servers on a human schedule.',
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
  },
};
