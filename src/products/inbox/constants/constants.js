/** How often the conversation list polls — a message can arrive at any time. */
export const POLL_MS = 30000;

/**
 * Events the inbox controller emits and the inbox hooks listen for.
 * PAGE_LOAD_* covers the list + summary loaded together (they always load as
 * a pair — see controller#loadInboxPage).
 */
export const INBOX_EVENTS = {
  PAGE_LOAD_SUCCESS: 'INBOX_PAGE_LOAD_SUCCESS',
  PAGE_LOAD_FAILURE: 'INBOX_PAGE_LOAD_FAILURE',
  THREAD_LOAD_SUCCESS: 'INBOX_THREAD_LOAD_SUCCESS',
  THREAD_LOAD_FAILURE: 'INBOX_THREAD_LOAD_FAILURE',
  MARK_READ_SUCCESS: 'INBOX_MARK_READ_SUCCESS',
  MARK_READ_FAILURE: 'INBOX_MARK_READ_FAILURE',
  SYNC_SUCCESS: 'INBOX_SYNC_SUCCESS',
  SYNC_FAILURE: 'INBOX_SYNC_FAILURE',
  SEND_SUCCESS: 'INBOX_SEND_SUCCESS',
  SEND_FAILURE: 'INBOX_SEND_FAILURE',
};
