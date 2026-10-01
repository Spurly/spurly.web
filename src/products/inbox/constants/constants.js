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
  REACT_SUCCESS: 'INBOX_REACT_SUCCESS',
  REACT_FAILURE: 'INBOX_REACT_FAILURE',
  MEDIA_SUCCESS: 'INBOX_MEDIA_SUCCESS',
  MEDIA_FAILURE: 'INBOX_MEDIA_FAILURE',
  ATTACHMENT_SUCCESS: 'INBOX_ATTACHMENT_SUCCESS',
  ATTACHMENT_FAILURE: 'INBOX_ATTACHMENT_FAILURE',
  INMAIL_SUCCESS: 'INBOX_INMAIL_SUCCESS',
  INMAIL_FAILURE: 'INBOX_INMAIL_FAILURE',
};

export const INMAIL_TEXT_MAX = 1900;
export const INMAIL_SUBJECT_MAX = 200;

/** Quick reactions offered on a message. LinkedIn accepts any emoji; these are the common set. */
export const REACTION_CHOICES = ['👍', '❤️', '😂', '😮', '🙏', '👏'];

/** What the attach button offers, and what each kind's file picker accepts (mirrors the server's media limits). */
export const MEDIA_KINDS = [
  { kind: 'attachment', label: 'File', accept: '.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp', maxMb: 20 },
  { kind: 'voice', label: 'Voice note (.m4a)', accept: '.m4a,audio/mp4,audio/x-m4a', maxMb: 10 },
  { kind: 'video', label: 'Video (.mp4 / .mov)', accept: '.mp4,.mov,video/mp4,video/quicktime', maxMb: 50 },
];
