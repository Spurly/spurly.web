/**
 * Static UI copy for the inbox pages (list + thread).
 *
 * STATIC only — see hub/campaigns/pages/strings.js for the scope this
 * follows across the app: no i18n library is installed, so this is one
 * reviewable place for fixed copy, not a translation layer. The empty-state
 * copy (four different causes — see useInboxPage.js#emptyStateFor) is data
 * built at runtime from the sync summary, not a flat string, so it stays in
 * the hook rather than here.
 */
export const inboxStrings = {
  pageTitle: 'Inbox',
  refreshTitle: 'Check for new messages',
  search: {
    placeholder: 'Search',
    ariaLabel: 'Search conversations',
    unread: 'Unread',
    unreadTitle: 'Show only conversations with unread messages',
  },
  list: {
    loading: 'Loading…',
    noneUnread: 'Nothing unread.',
    noMatch: 'No conversations match that.',
  },
  syncNow: 'Sync now',
  thread: {
    pickConversation: 'Pick a conversation',
    loading: 'Loading…',
    historyPending: 'Still fetching this conversation’s history — there may be more above.',
    noMessages: 'No messages in this conversation.',
    readOnly: 'LinkedIn has this conversation as read-only, so it cannot be replied to.',
    composerPlaceholder: 'Write a reply…  (⌘↵ to send)',
    composerAriaLabel: 'Reply',
    sendTitle: 'Send now',
  },
};
