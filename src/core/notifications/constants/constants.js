/**
 * Event names the notifications controller emits and useNotifications
 * listens for. Centralized so the two sides can never drift — a typo in a
 * raw string on either end would silently just never fire the listener,
 * with nothing to point at why.
 */
export const NOTIFICATION_EVENTS = {
  LIST_SUCCESS: 'NOTIFICATIONS_LIST_SUCCESS',
  LIST_FAILURE: 'NOTIFICATIONS_LIST_FAILURE',
  MARK_READ_SUCCESS: 'NOTIFICATIONS_MARK_READ_SUCCESS',
  MARK_READ_FAILURE: 'NOTIFICATIONS_MARK_READ_FAILURE',
  MARK_ALL_READ_SUCCESS: 'NOTIFICATIONS_MARK_ALL_READ_SUCCESS',
  MARK_ALL_READ_FAILURE: 'NOTIFICATIONS_MARK_ALL_READ_FAILURE',
};
