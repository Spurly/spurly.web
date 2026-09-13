/**
 * Static UI copy for the leads page.
 *
 * STATIC only — see campaigns/strings.js for the scope this follows across
 * the app: no i18n library is installed, so this is one reviewable place for
 * fixed copy, not a translation layer. The page subtitle (people/audience
 * counts) and the toast messages built from a request's result stay inline
 * where they're assembled.
 */
export const leadsStrings = {
  pageTitle: 'Leads',
  connectLinkedIn: {
    title: 'Connect LinkedIn first',
    body: 'Connect your LinkedIn account before importing.',
    hint: 'Searches run through your own account, so there is nothing to read results with until it is linked.',
    cta: 'Go to LinkedIn settings',
  },
  filteredBy: 'Filtered by',
  untitledAudience: 'Untitled audience',
  table: {
    searchPlaceholder: 'Search name, headline, company',
    emptyMessageFiltered: 'No leads from this audience yet',
    emptyMessageAll: 'No leads yet',
    emptyHintNoAudience: 'Paste a LinkedIn search or build one from filters above to get your first audience.',
    emptyHintImporting: 'Imports run in the background — this fills in as pages come back.',
    createCampaign: 'Send connection requests',
    createMessageCampaign: 'Send messages',
    enrollPlaceholder: 'Enroll in sequence…',
    enrolling: 'Enrolling…',
    enrollTitleDisabled: 'Create a sequence first',
    enrollTitleEnabled: 'Enroll the selection in a sequence',
    // The "which audience am I looking at" picker, right on the table —
    // moved out of the dock so filtering the list doesn't require opening a
    // panel first. Defaults to everyone.
    listFilterLabel: 'Filter by list',
    listFilterAll: 'All people',
  },
  dock: {
    label: 'Audiences',
    saved: 'saved',
    buildNew: 'Build a new one',
  },
};
