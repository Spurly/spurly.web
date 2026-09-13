/**
 * Static UI copy for all three sequences pages (list, new, detail).
 *
 * STATIC only — see hub/campaigns/pages/strings.js for the scope this
 * follows across the app: no i18n library is installed, so this is one
 * reviewable place for fixed copy, not a translation layer. Counts, names,
 * and toast messages built from a request's result stay inline where
 * they're assembled.
 */
const pageSubtitle = 'A linear list of steps, run against whoever you enroll.';

export const sequencesStrings = {
  list: {
    pageTitle: 'Sequences',
    pageSubtitle,
    newSequence: 'New sequence',
    sectionTitle: 'Sequences',
    loading: 'Loading…',
    emptyTitle: 'No sequences yet',
    emptyHint: 'A sequence is a list of steps — visit, connect, message, wait — run against the leads you enroll.',
  },
  new: {
    pageTitle: 'New sequence',
    pageSubtitle,
    createButton: 'Create sequence',
    allSequences: 'All sequences',
    nameSectionTitle: 'Name',
    namePlaceholder: 'e.g. Cold outreach — founders',
    stepsSectionTitle: 'Steps',
  },
  detail: {
    loadingPageTitle: 'Sequence',
    loading: 'Loading…',
    notFound: 'That sequence is not here.',
    backToSequences: 'Back to sequences',
    allSequences: 'All sequences',
    pause: 'Pause',
    start: 'Start',
    resume: 'Resume',
    remove: 'Remove',
    stepsSectionTitle: 'Steps',
    saveSteps: 'Save steps',
    noEnrollmentsBefore: 'Nobody is enrolled yet. Select leads on the ',
    noEnrollmentsLink: 'leads page',
    noEnrollmentsAfter: ' and enroll them in this sequence, then come back here to start it.',
    table: {
      emptyMessageFiltered: 'Nobody in this state',
      emptyMessageAll: 'Nobody enrolled yet',
      emptyHintFiltered: 'Try another filter.',
      emptyHintAll: 'Enroll leads from the leads page.',
    },
  },
};
