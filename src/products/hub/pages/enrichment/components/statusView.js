/**
 * Shared between the list row and the detail header — same reasoning as
 * campaigns/components/statusView.js. Only two states exist here: there is
 * no draft (creating a campaign queues it in the same call) and no paused
 * (nothing here is ever stopped mid-way by the user).
 */
export const ENRICHMENT_STATUS_VIEW = {
  running: { label: 'Running', tone: 'info', detail: 'Still resolving profiles.' },
  done: { label: 'Done', tone: 'success', detail: 'Every lead in this campaign has a final status.' },
};
