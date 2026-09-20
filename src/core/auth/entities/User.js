/**
 * User Entity
 * Represents the User model from backend
 */

function createUser(data) {
  const user = {
    _id: data._id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    linkedinProfile: data.linkedinProfile,
    profilePicture: data.profilePicture,
    companyName: data.companyName,
    sector: data.sector,
    location: data.location,
    teamSize: data.teamSize,
    role: data.role,
    teamSizeRange: data.teamSizeRange,
    primaryGoal: data.primaryGoal,
    monthlyActivity: data.monthlyActivity,
    linkedinPlan: data.linkedinPlan,
    companyWebsite: data.companyWebsite,
    /* Per-table UI preferences, keyed by table id: { people: { columnOrder } }.
       Arrives with /auth/me, so a saved column order is already in hand on the
       first render of a table - no second request, no visible reshuffle. */
    tablePreferences: data.tablePreferences || {},
    onboardingComplete: data.onboardingComplete ?? false,
    // null = "never resolved" -- see postAuthDestination.js. Never defaulted to
    // a non-null value here, or a legacy already-onboarded user would read as
    // mid-onboarding purely from a frontend normalisation bug.
    onboardingStage: data.onboardingStage ?? null,
    isAdmin: data.isAdmin ?? false,
    tier: data.tier || 'free',
    creditBalance: data.creditBalance ?? 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };

  user.toJSON = () => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    linkedinProfile: user.linkedinProfile,
    profilePicture: user.profilePicture,
    companyName: user.companyName,
    sector: user.sector,
    location: user.location,
    teamSize: user.teamSize,
    role: user.role,
    teamSizeRange: user.teamSizeRange,
    primaryGoal: user.primaryGoal,
    monthlyActivity: user.monthlyActivity,
    linkedinPlan: user.linkedinPlan,
    companyWebsite: user.companyWebsite,
    tablePreferences: user.tablePreferences,
    onboardingComplete: user.onboardingComplete,
    onboardingStage: user.onboardingStage,
    isAdmin: user.isAdmin,
    tier: user.tier,
    creditBalance: user.creditBalance,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

  return user;
}

export const User = {
  fromResponse(data) {
    return createUser(data);
  },
};

/**
 * Auth Response Entity
 * Response from auth endpoints
 */
function createAuthResponse(data) {
  const authResponse = {
    success: data.success,
    message: data.message,
    data: data.data,
    status: data.status,
  };

  authResponse.getUser = () => (authResponse.data?.user ? User.fromResponse(authResponse.data.user) : null);
  authResponse.getToken = () => authResponse.data?.token || null;

  return authResponse;
}

export const AuthResponse = {
  fromResponse(data) {
    return createAuthResponse(data);
  },
};
