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
 *
 * D1: `onboardingStage` is the finer-grained successor to the plain
 * onboardingComplete boolean — a paying user now has TWO more steps
 * (LinkedIn connect, audience) between the survey and install, and a single
 * boolean cannot represent "done with the survey, not done with LinkedIn".
 * `onboardingStage` is null for every account that predates this flow, and
 * MUST STAY null for them (see the User model comment and PLAN §7.5) —
 * so null here means "fall through to the legacy rule", never "no stage
 * yet, default to the beginning". Only an account whose stage was actually
 * stamped by completeOnboarding or setOnboardingStage takes the
 * stage-aware branch below.
 */
const STAGE_DESTINATION = {
  survey: '/onboarding',
  linkedin: '/onboarding/linkedin',
  audience: '/onboarding/audience',
  install: '/onboarding/install',
  done: '/dashboard',
};

export function postAuthDestination(user) {
  if (user?.onboardingStage) {
    return STAGE_DESTINATION[user.onboardingStage] ?? '/dashboard';
  }
  return user?.onboardingComplete === false ? '/onboarding' : '/dashboard';
}
