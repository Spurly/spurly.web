/**
 * Static UI copy for both enrichment pages (list + detail). Same reasoning
 * as campaigns/strings.js: reviewable copy in one place, not an i18n layer.
 */
export const enrichmentStrings = {
  list: {
    pageTitle: 'Enrichment',
    pageSubtitle: 'Named batches of leads sent through bulk enrichment together.',
    emptyTitle: 'No enrichment campaigns yet',
    emptyHint: 'Select some leads on the "Needs enrichment" tab of the leads page, then enrich them from the selection.',
    goToLeads: 'Go to leads',
  },
  detail: {
    loadingPageTitle: 'Enrichment campaign',
    loading: 'Loading…',
    notFound: 'That enrichment campaign is not here.',
    backToList: 'Back to enrichment',
    allCampaigns: 'All enrichment campaigns',
    sectionTitle: 'Leads',
    retryFailed: 'Retry failed',
  },
};
