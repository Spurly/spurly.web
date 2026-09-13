/**
 * Where to send a user once their session (or their payment) is settled.
 *
 * Every caller used to hardcode '/onboarding', which is only correct for an
 * account that hasn't finished the survey. For everyone else /onboarding
 * immediately forwards to /onboarding/install — a page with no automatic way
 * out — so "you just paid" and "your status refreshed" both ended in a dead
 * end instead of the dashboard.
 *
 * `onboardingComplete` is normalised to a boolean by the User entity, so the
 * `=== false` test is exact rather than defensive: an undefined value (a user
 * object assembled somewhere that skipped the entity) is treated as "done"
 * and sent to the dashboard, which is the recoverable direction to be wrong
 * in — the dashboard has navigation, the install page does not.
 */
export function postAuthDestination(user) {
  return user?.onboardingComplete === false ? '/onboarding' : '/dashboard';
}
