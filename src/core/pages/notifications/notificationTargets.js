/**
 * Where a notification (or one specific person inside it) should send the
 * user, in-app. Split out of NotificationBell/NotificationsPage so both
 * surfaces (the dropdown feed and the full-history page) resolve a click
 * the exact same way instead of drifting apart.
 *
 * Kept deliberately conservative: a type only gets a specific destination
 * once its payload actually carries what that destination needs (a lead
 * id, a campaign id, ...). Anything else falls back to the notifications
 * page itself, which is always a safe, correct answer.
 */

/** A single person's own lead drawer, e.g. from an AvatarStack face. */
export function leadTarget(person) {
  if (person?.hubLeadId) return `/hub/leads?lead=${encodeURIComponent(person.hubLeadId)}`;
  if (person?.profileUrl) return person.profileUrl;
  return '/dashboard/notifications';
}

/**
 * Whole-row click target. For the two "about a person" event types
 * (connection_accepted, leads_enrichment_completed) a single-person event
 * goes straight to that lead's drawer, same as clicking their avatar would
 * — there's nowhere more specific for a multi-person one to go than the
 * leads list itself.
 */
/**
 * `leadTarget`'s fallback can return an absolute LinkedIn URL (for a
 * notification written before this lead carried a hubLeadId) instead of an
 * in-app path — react-router's `navigate()` can't take that, it would try
 * to route to it as if it were a path. Callers should go through this
 * instead of calling `navigate` directly.
 */
export function goToTarget(navigate, target) {
  if (/^https?:\/\//.test(target)) {
    window.open(target, '_blank', 'noopener,noreferrer');
    return;
  }
  navigate(target);
}

export function resolveNotificationTarget(notification) {
  const { type, payload } = notification || {};
  const people = payload?.people;

  switch (type) {
    case 'hub.connection_accepted':
    case 'hub.leads_enrichment_completed':
      if (people?.length === 1) return leadTarget(people[0]);
      return '/hub/leads';
    default:
      return '/dashboard/notifications';
  }
}
