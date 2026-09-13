/**
 * Static UI copy for the Campaigns list page.
 *
 * STATIC only — see leads/strings.js for the scope this follows. The
 * campaign detail page's copy is almost entirely built from live campaign/
 * send state (status, counts, budget, template names) rather than fixed
 * strings, so it stays inline in CampaignDetailPage.jsx and
 * components/DetailControls.jsx instead of here.
 */
export const campaignsStrings = {
  pageTitle: 'Campaigns',
  pageSubtitle: 'Outreach campaigns built from your captured Contacts.',
  searchPlaceholder: 'Search a campaign...',
  emptySearch: 'No campaigns match your search',
  emptyAll: 'No campaigns yet',
  emptySearchHint: 'Try a different search term',
  emptyAllHint: 'Select people on the Contacts tab and click “Create campaign” to get started.',
  confirmDelete: {
    description: 'This removes the campaign and its enrolled leads.',
    confirmLabel: 'Delete campaign',
  },
  deleteErrorFallback: "Couldn't delete the campaign",
};
