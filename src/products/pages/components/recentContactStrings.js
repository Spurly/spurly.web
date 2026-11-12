/** Static copy for the "skip people I've messaged recently" rule, shared by campaigns, sequences and Settings. */
export const recentContactStrings = {
  title: 'Skip people I’ve already messaged',
  railTitle: 'Who it skips',
  hint: (days) => `Leave out anyone you sent a message to in the last ${days} ${days === 1 ? 'day' : 'days'}.`,
  hintOff: 'Leave out people you messaged recently, so nobody gets two pitches close together.',
  daysLabel: 'Look back',
  daysUnit: 'days',
  customLabel: 'Custom days',
  customInvalid: (min, max) => `Enter a whole number from ${min} to ${max}.`,
  scopeLabel: 'Who counts',
  scopeOptions: [
    ['org', 'Anyone on my team'],
    ['account', 'Only this sending account'],
  ],
  scopeHint: {
    org: 'A message from any account in your organization counts.',
    account: 'Only messages sent from the account doing the sending count.',
  },
  // A message sent from LinkedIn itself, or by another campaign or sequence, counts too.
  footnote: 'Counts messages sent from Spurly or typed in LinkedIn. A connection note is not a message.',
  locked: 'Pause the campaign to change this.',
  skippedChip: (days) => (days === 0 ? 'Messaged today' : days === 1 ? 'Messaged yesterday' : `Messaged ${days} days ago`),
  skippedLabel: 'Recently messaged',
  // A sequence stops BEFORE its first message, so it reads as skipped rather than as something that ended.
  skippedSequence: (days) => `Skipped: ${days === 0 ? 'messaged today' : days === 1 ? 'messaged yesterday' : `messaged ${days} days ago`}`,
  skippedSequenceFallback: 'Skipped: messaged recently',
};
