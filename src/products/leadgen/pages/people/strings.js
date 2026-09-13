/**
 * Static UI copy for the People page.
 *
 * STATIC only — see hub/campaigns/pages/strings.js for the scope this
 * follows across the app: no i18n library is installed, so this is one
 * reviewable place for fixed copy, not a translation layer. The page
 * subtitle (captured/contacted counts) and toast messages built from a
 * request's result stay inline where they're assembled.
 */
export const peopleStrings = {
  pageTitle: 'Contacts',
  search: {
    placeholder: 'Search name, company, location',
  },
  importToHub: 'Import to Hub',
  resetColumns: 'Reset columns',
  resetColumnsTitle: 'Put the columns back in their default order',
  export: 'Export',
  emptyMessage: {
    search: 'No contacts match your search',
    filtered: 'No contacts in this status',
    none: 'No contacts captured yet',
  },
  emptyHint: {
    search: 'Try a different search term',
    filtered: 'Try a different status filter',
    none: 'Contacts you capture from LinkedIn will appear here',
  },
};
