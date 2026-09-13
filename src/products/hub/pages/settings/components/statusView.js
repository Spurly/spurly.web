/**
 * Per-status label/tone/detail for the LinkedIn account card, and the
 * matching "why did the session die" hint. Extracted from the page
 * component only to keep it non-exporting-a-component, same reasoning as
 * hub/campaigns' statusView.js.
 */
export const STATUS_VIEW = {
  OK: {
    label: 'Connected',
    tone: 'var(--ui-success)',
    tint: 'var(--ui-success-tint)',
    detail: 'Spurly can send connection requests and messages as you.',
  },
  CONNECTING: {
    label: 'Setting up',
    tone: 'var(--ui-text-tertiary)',
    tint: 'var(--ui-surface-sunken)',
    detail: 'LinkedIn is syncing. This usually takes under a minute.',
  },
  CREDENTIALS: {
    label: 'Needs reconnecting',
    tone: 'var(--ui-warning)',
    tint: 'var(--ui-warning-tint)',
    detail: 'LinkedIn ended the session. Nothing will send until you reconnect.',
  },
  STOPPED: {
    label: 'Stopped',
    tone: 'var(--ui-danger)',
    tint: 'var(--ui-danger-tint)',
    detail: 'The connection stopped unexpectedly. Reconnect to resume sending.',
  },
  DELETED: {
    label: 'Disconnected',
    tone: 'var(--ui-text-tertiary)',
    tint: 'var(--ui-surface-sunken)',
    detail: 'This account was removed. Your campaign history is kept.',
  },
};

/** How the session died decides what we tell the user to expect next time. */
export const RECONNECT_HINT = {
  cookies: 'This happens when you sign out of the browser you connected from.',
  credentials: 'This happens when the session is revoked in LinkedIn’s settings.',
};
