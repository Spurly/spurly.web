/**
 * Static UI copy for all three sequences pages (list, new, detail).
 *
 * STATIC only — see hub/campaigns/pages/strings.js for the scope this
 * follows across the app: no i18n library is installed, so this is one
 * reviewable place for fixed copy, not a translation layer. Counts, names,
 * and toast messages built from a request's result stay inline where
 * they're assembled.
 */
const pageSubtitle = 'Steps Spurly runs for everyone you enroll — visit, connect, wait, message — spaced like a person would.';

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
    nameDialogTitle: 'Name this sequence',
    nameDialogDescription: 'Give it a name you\'ll recognize on the sequences list.',
    nameDialogCancel: 'Cancel',
    nameDialogConfirm: 'Create sequence',
  },
  detail: {
    loadingPageTitle: 'Sequence',
    repliesElsewhere: "Replies are tracked by your partner's app, not here.",
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
  tree: {
    yes: 'Yes',
    no: 'No',
    branches: 'Branches',
    emptyBranch: 'Nothing here: leads on this side finish.',
    addCheck: 'Add a check',
    removeBranching: 'Remove (and everything inside)',
    repliesElsewhere: "Reply checks are hidden: replies are tracked by your partner's app, not here.",
    waitForHint: 'The event happening first sends the lead down Yes. The deadline passing first sends them down No.',
    stepLabel: (node, steps) => `Step ${steps.indexOf(node) + 1}${node.parentId ? ` · ${node.branch === 'yes' ? 'Yes' : 'No'}` : ''}`,
  },
  exit: {
    title: 'Stop rules',
    dialogDescription: 'When Spurly should pull someone out of this sequence. Applies to this sequence only.',
    done: 'Done',
    repliesElsewhere: "Reply stopping is off: replies are tracked by your partner's app, not here.",
    maxDaysBefore: 'Stop anyone still in the sequence after',
    maxDaysAfter: 'days (blank = never)',
  },
};
