/**
 * Shared between the sequences list and detail pages — both showed the exact
 * same tone/label/detail per status as two separate copies before this file
 * existed. Same extraction as hub/campaigns' statusView.js.
 */
export const SEQUENCE_STATUS_VIEW = {
  draft: { label: 'Draft', tone: 'neutral', detail: 'Nothing runs until you enroll leads and start it.' },
  running: { label: 'Running', tone: 'success', detail: 'Steps run on their own schedule.' },
  paused: { label: 'Paused', tone: 'warning', detail: 'Stopped. Enrollment progress is kept.' },
  done: { label: 'Finished', tone: 'info', detail: 'Everyone enrolled has been handled.' },
};
