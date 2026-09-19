/**
 * Shared between the list row and the detail header — kept as data, not
 * duplicated as two literal objects that could drift.
 */
export const CAMPAIGN_STATUS_VIEW = {
  draft: { label: 'Draft', tone: 'neutral', detail: 'Nothing has been sent. Start it when you are ready.' },
  running: { label: 'Sending', tone: 'accent', detail: 'Sending, paced through your working hours.' },
  paused: { label: 'Paused', tone: 'warning', detail: 'Stopped. The queue is intact.' },
  done: { label: 'Finished', tone: 'success', detail: 'Everyone in this campaign has been handled.' },
};
