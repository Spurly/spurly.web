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
  // The handoff's line is "…sourced for you, scored against your ICP". Fit
  // scoring is not built yet, so the scoring clause waits for it.
  pageSubtitle: 'Everyone Spurly has sourced for you. Imports keep running in the background — the list fills in as pages come back.',
  newAudience: 'New audience',
  tabs: {
    all: 'All leads',
    enrich: 'Needs enrichment',
  },
  enrichTab: {
    searchPlaceholder: 'Search name, headline, company',
    emptyMessage: 'Nothing needs enrichment',
    emptyHint: 'Every captured lead here already has a full profile.',
    enrichSelected: 'Create enrichment campaign',
  },
  connectLinkedIn: {
    title: 'Connect LinkedIn first',
    body: 'Connect your LinkedIn account before importing.',
    hint: 'Searches run through your own account, so there is nothing to read results with until it is linked.',
    cta: 'Go to LinkedIn settings',
  },
  filteredBy: 'Filtered by',
  untitledAudience: 'Untitled audience',
  table: {
    searchPlaceholder: 'Search by name, headline or company',
    emptyMessageFiltered: 'No leads from this audience yet',
    emptyMessageAll: 'No leads yet',
    emptyHintNoAudience: 'Paste a LinkedIn search you already trust, or build one from LinkedIn’s filters. Imports run in the background — this fills in as pages come back.',
    emptyHintImporting: 'Imports run in the background — this fills in as pages come back.',
    createCampaign: 'Send requests',
    draftOpeners: 'Draft openers',
    createMessageCampaign: 'Send messages',
    createEnrichmentCampaign: 'Enrich',
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
