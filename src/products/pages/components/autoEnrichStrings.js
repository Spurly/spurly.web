/** Static copy for the automatic-enrichment card. */
export const autoEnrichStrings = {
  title: 'Automatic enrichment',
  switchTitle: 'Enrich my leads automatically',
  hint: 'Spurly fills in the full profile (company, title, location) for your leads a few at a time, at an uneven pace and slower in your quiet hours.',
  hintOrg: 'Spurly fills in the full profile for your team’s leads a few at a time. Every LinkedIn account gets its own daily amount, at an uneven pace and slower in quiet hours.',
  amountLabel: 'Profiles per day',
  amountHelp: (min, max) => `From ${min} to ${max}. Lower is gentler on your LinkedIn account.`,
  customLabel: 'Custom amount',
  customInvalid: (min, max) => `Enter a whole number from ${min} to ${max}.`,
  includeFailedTitle: 'Try leads that failed before',
  includeFailedHint: 'Leads LinkedIn could not read earlier are queued again.',
  progress: (used, waiting, needing) => `${used} looked up in the last 24 hours · ${waiting} waiting · ${needing} still to do`,
  startsNote: 'The first lookups start a little while after you switch this on.',
  footnote: 'Spurly never goes above 100 profiles a day per account, and pauses on its own if LinkedIn pushes back. Leads you enrich by hand always go first.',
  loadError: 'Could not load this setting.',
};
