/**
 * Static UI copy for the Connections page.
 *
 * STATIC only — see leads/strings.js for the scope this follows: no i18n
 * library is installed, so this is one reviewable place for fixed copy.
 * Sync/export toast text built from a request's counts stays inline where
 * it's assembled (see components/helpers.js for the sync summary sentence).
 */
export const connectionsStrings = {
  pageTitle: 'Connections',
  table: {
    searchPlaceholder: 'Search name, company, location',
    emptyMessageSearch: 'No connections match your search',
    emptyMessageAll: 'No connections captured yet',
    emptyHintSearch: 'Try a different search term',
    emptyHintAll:
      'Open your LinkedIn connections page with the Spurly extension and tick the people you want to save',
  },
  sync: {
    startToastTitle: 'Syncing your connections',
    startToastDescription: 'This takes a minute. You can leave this page.',
    successToastTitle: 'Connections synced',
    errorToastFallback: "Couldn't sync your connections",
    idle: 'Sync now',
    running: 'Syncing…',
    title: 'Read LinkedIn for connections added since the last sync',
  },
  export: {
    label: 'Export',
    errorToastFallback: "Couldn't export your connections",
  },
  campaign: {
    errorToastFallback: "Couldn't create the campaign",
  },
};
