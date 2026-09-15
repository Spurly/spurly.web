import authGateway from '../gateway/auth.js';
import apiGateway from 'src/shared/gateway/apiGateway.js';
import { AUTH_EVENTS } from '../constants/constants.js';

/**
 * Auth Controller
 * Orchestrates business logic for authentication
 * Acts as intermediary between UI layer and API layer
 */

/**
 * Handle user login
 * @param {EventEmitter} eventEmitter
 * @param {string} email
 * @param {string} password
 */
async function login(eventEmitter, email, password) {
  try {
    const authResponse = await authGateway.login({ email, password });

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    // Store token and user data
    const token = authResponse.getToken();
    const user = authResponse.getUser();

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    // Set token in API gateway and local storage
    apiGateway.setToken(token);
    localStorage.setItem('user', JSON.stringify(user.toJSON()));

    eventEmitter.emit(AUTH_EVENTS.LOGIN_SUCCESS, { user, token });
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.LOGIN_FAILURE, error);
  }
}

/**
 * Handle user registration
 * @param {EventEmitter} eventEmitter
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string} confirmPassword
 */
async function register(eventEmitter, name, email, password, confirmPassword) {
  try {
    const authResponse = await authGateway.register({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    // Store token and user data
    const token = authResponse.getToken();
    const user = authResponse.getUser();

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    apiGateway.setToken(token);
    localStorage.setItem('user', JSON.stringify(user.toJSON()));

    eventEmitter.emit(AUTH_EVENTS.REGISTER_SUCCESS, { user, token });
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.REGISTER_FAILURE, error);
  }
}

/**
 * Step 1 of OTP signup: request a verification code. No account yet.
 * @param {EventEmitter} eventEmitter
 * @param {Object} params - { name, email, password, confirmPassword, phone, referralCode? }
 */
async function requestSignupOtp(eventEmitter, { name, email, password, confirmPassword, phone, referralCode }) {
  try {
    const authResponse = await authGateway.requestSignupOtp({
      name,
      email,
      password,
      confirmPassword,
      phone,
      referralCode,
    });

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    eventEmitter.emit(AUTH_EVENTS.REQUEST_SIGNUP_OTP_SUCCESS, { email: authResponse.data?.email || email });
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.REQUEST_SIGNUP_OTP_FAILURE, error);
  }
}

/**
 * Step 2 of OTP signup: verify the code, create the account, sign in.
 * @param {EventEmitter} eventEmitter
 * @param {Object} params - { email, code }
 */
async function verifySignupOtp(eventEmitter, { email, code }) {
  try {
    const authResponse = await authGateway.verifySignupOtp({ email, code });

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    const token = authResponse.getToken();
    const user = authResponse.getUser();

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    apiGateway.setToken(token);
    localStorage.setItem('user', JSON.stringify(user.toJSON()));

    eventEmitter.emit(AUTH_EVENTS.VERIFY_SIGNUP_OTP_SUCCESS, { user, token });
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.VERIFY_SIGNUP_OTP_FAILURE, error);
  }
}

/**
 * Request a password reset code (emailed to the user).
 * @param {EventEmitter} eventEmitter
 * @param {string} email
 */
async function forgotPassword(eventEmitter, email) {
  try {
    const authResponse = await authGateway.forgotPassword({ email });

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    eventEmitter.emit(AUTH_EVENTS.FORGOT_PASSWORD_SUCCESS, { message: authResponse.message });
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.FORGOT_PASSWORD_FAILURE, error);
  }
}

/**
 * Set a new password using the emailed code, then sign in.
 * @param {EventEmitter} eventEmitter
 * @param {Object} params - { email, code, password, confirmPassword }
 */
async function resetPassword(eventEmitter, { email, code, password, confirmPassword }) {
  try {
    const authResponse = await authGateway.resetPassword({
      email,
      code,
      password,
      confirmPassword,
    });

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    const token = authResponse.getToken();
    const user = authResponse.getUser();

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    apiGateway.setToken(token);
    localStorage.setItem('user', JSON.stringify(user.toJSON()));

    eventEmitter.emit(AUTH_EVENTS.RESET_PASSWORD_SUCCESS, { user, token });
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.RESET_PASSWORD_FAILURE, error);
  }
}

/**
 * Handle logout. Always resolves — a failed logout call server-side is
 * logged, not surfaced, and local session state is cleared either way.
 * @param {EventEmitter} eventEmitter
 */
async function logout(eventEmitter) {
  try {
    await authGateway.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Clear local storage and API gateway
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  apiGateway.removeToken();

  eventEmitter.emit(AUTH_EVENTS.LOGOUT_SUCCESS);
}

/**
 * Get current user from localStorage
 * @returns {User|null}
 */
function getCurrentUserFromStorage() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Fetch current user from API
 * @param {EventEmitter} eventEmitter
 */
async function fetchCurrentUser(eventEmitter) {
  try {
    const user = await authGateway.getCurrentUser();

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    eventEmitter.emit(AUTH_EVENTS.FETCH_CURRENT_USER_SUCCESS, user);
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.FETCH_CURRENT_USER_FAILURE, error);
  }
}

/**
 * Update user profile
 * @param {EventEmitter} eventEmitter
 * @param {object} profileData
 */
async function updateProfile(eventEmitter, profileData) {
  try {
    const user = await authGateway.updateProfile(profileData);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    eventEmitter.emit(AUTH_EVENTS.UPDATE_PROFILE_SUCCESS, user);
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.UPDATE_PROFILE_FAILURE, error);
  }
}

/**
 * Complete the onboarding survey and persist the updated user.
 * @param {EventEmitter} eventEmitter
 * @param {Object} data - { role, teamSizeRange, primaryGoal, monthlyActivity, companyName, linkedinPlan?, companyWebsite? }
 */
async function completeOnboarding(eventEmitter, data) {
  try {
    const user = await authGateway.completeOnboarding(data);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    eventEmitter.emit(AUTH_EVENTS.COMPLETE_ONBOARDING_SUCCESS, user);
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.COMPLETE_ONBOARDING_FAILURE, error);
  }
}

/**
 * Save the user's column order for one table.
 * @param {EventEmitter} eventEmitter
 * @param {string}   tableId
 * @param {string[]} columnOrder
 */
async function saveTableColumnOrder(eventEmitter, tableId, columnOrder) {
  try {
    const user = await authGateway.saveTableColumnOrder(tableId, columnOrder);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    eventEmitter.emit(AUTH_EVENTS.SAVE_TABLE_COLUMN_ORDER_SUCCESS, user);
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.SAVE_TABLE_COLUMN_ORDER_FAILURE, error);
  }
}

/**
 * Reset one table back to its default column order.
 * @param {EventEmitter} eventEmitter
 * @param {string} tableId
 */
async function resetTableColumnOrder(eventEmitter, tableId) {
  try {
    const user = await authGateway.resetTableColumnOrder(tableId);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    eventEmitter.emit(AUTH_EVENTS.RESET_TABLE_COLUMN_ORDER_SUCCESS, user);
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.RESET_TABLE_COLUMN_ORDER_FAILURE, error);
  }
}

/**
 * Get LinkedIn OAuth redirect URL
 * @param {EventEmitter} eventEmitter
 */
async function getLinkedInAuthUrl(eventEmitter) {
  try {
    const url = await authGateway.getLinkedInAuthUrl();
    eventEmitter.emit(AUTH_EVENTS.GET_LINKEDIN_AUTH_URL_SUCCESS, url);
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.GET_LINKEDIN_AUTH_URL_FAILURE, error);
  }
}

/**
 * Get Google OAuth redirect URL (web flow)
 * @param {EventEmitter} eventEmitter
 */
async function getGoogleAuthUrl(eventEmitter) {
  try {
    const url = await authGateway.getGoogleAuthUrl();
    eventEmitter.emit(AUTH_EVENTS.GET_GOOGLE_AUTH_URL_SUCCESS, url);
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.GET_GOOGLE_AUTH_URL_FAILURE, error);
  }
}

/**
 * Handle LinkedIn OAuth callback
 * @param {EventEmitter} eventEmitter
 * @param {string} code
 */
async function handleLinkedInCallback(eventEmitter, code) {
  try {
    const authResponse = await authGateway.linkedinCallback(code);

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    const token = authResponse.getToken();
    const user = authResponse.getUser();

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    apiGateway.setToken(token);
    localStorage.setItem('user', JSON.stringify(user.toJSON()));

    eventEmitter.emit(AUTH_EVENTS.HANDLE_LINKEDIN_CALLBACK_SUCCESS, { user, token });
  } catch (error) {
    eventEmitter.emit(AUTH_EVENTS.HANDLE_LINKEDIN_CALLBACK_FAILURE, error);
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
  return apiGateway.isAuthenticated();
}

/**
 * Get stored token
 * @returns {string|null}
 */
function getToken() {
  return apiGateway.getToken();
}

const authController = {
  login,
  register,
  requestSignupOtp,
  verifySignupOtp,
  forgotPassword,
  resetPassword,
  logout,
  getCurrentUserFromStorage,
  fetchCurrentUser,
  updateProfile,
  completeOnboarding,
  saveTableColumnOrder,
  resetTableColumnOrder,
  getLinkedInAuthUrl,
  getGoogleAuthUrl,
  handleLinkedInCallback,
  isAuthenticated,
  getToken,
};

export default authController;
