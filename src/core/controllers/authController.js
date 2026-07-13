import authApi from 'src/core/gateway/authApi.js';
import apiGateway from 'src/core/gateway/apiGateway.js';

/**
 * Auth Controller
 * Orchestrates business logic for authentication
 * Acts as intermediary between UI layer and API layer
 */

class AuthController {
  /**
   * Handle user login
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user, token}>}
   */
  async login(email, password) {
    const authResponse = await authApi.login({ email, password });

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

    return { user, token };
  }

  /**
   * Handle user registration
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} confirmPassword
   * @returns {Promise<{user, token}>}
   */
  async register(name, email, password, confirmPassword) {
    const authResponse = await authApi.register({
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

    return { user, token };
  }

  /**
   * Step 1 of OTP signup: request a verification code. No account yet.
   * @param {Object} params - { name, email, password, confirmPassword, phone, referralCode? }
   * @returns {Promise<{email: string}>}
   */
  async requestSignupOtp({ name, email, password, confirmPassword, phone, referralCode }) {
    const authResponse = await authApi.requestSignupOtp({
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

    return { email: authResponse.data?.email || email };
  }

  /**
   * Step 2 of OTP signup: verify the code, create the account, sign in.
   * @param {Object} params - { email, code }
   * @returns {Promise<{user, token}>}
   */
  async verifySignupOtp({ email, code }) {
    const authResponse = await authApi.verifySignupOtp({ email, code });

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

    return { user, token };
  }

  /**
   * Request a password reset code (emailed to the user).
   * @param {string} email
   * @returns {Promise<{message: string}>}
   */
  async forgotPassword(email) {
    const authResponse = await authApi.forgotPassword({ email });

    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }

    return { message: authResponse.message };
  }

  /**
   * Set a new password using the emailed code, then sign in.
   * @param {Object} params - { email, code, password, confirmPassword }
   * @returns {Promise<{user, token}>}
   */
  async resetPassword({ email, code, password, confirmPassword }) {
    const authResponse = await authApi.resetPassword({
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

    return { user, token };
  }

  /**
   * Handle logout
   */
  async logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear local storage and API gateway
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    apiGateway.removeToken();
  }

  /**
   * Get current user from localStorage
   * @returns {User|null}
   */
  getCurrentUserFromStorage() {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    try {
      const userData = JSON.parse(userJson);
      return userData;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Fetch current user from API
   * @returns {Promise<User>}
   */
  async fetchCurrentUser() {
    const user = await authApi.getCurrentUser();

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    return user;
  }

  /**
   * Update user profile
   * @param {object} profileData
   * @returns {Promise<User>}
   */
  async updateProfile(profileData) {
    const user = await authApi.updateProfile(profileData);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    return user;
  }

  /**
   * Complete the onboarding survey and persist the updated user.
   * @param {Object} data - { role, teamSizeRange, primaryGoal, monthlyActivity, companyName, companyWebsite? }
   * @returns {Promise<User>}
   */
  async completeOnboarding(data) {
    const user = await authApi.completeOnboarding(data);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user.toJSON()));
    }

    return user;
  }

  /**
   * Get LinkedIn OAuth redirect URL
   * @returns {Promise<string>}
   */
  async getLinkedInAuthUrl() {
    return await authApi.getLinkedInAuthUrl();
  }

  /**
   * Get Google OAuth redirect URL (web flow)
   * @returns {Promise<string>}
   */
  async getGoogleAuthUrl() {
    return await authApi.getGoogleAuthUrl();
  }

  /**
   * Handle LinkedIn OAuth callback
   * @param {string} code
   * @returns {Promise<{user, token}>}
   */
  async handleLinkedInCallback(code) {
    const authResponse = await authApi.linkedinCallback(code);

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

    return { user, token };
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return apiGateway.isAuthenticated();
  }

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    return apiGateway.getToken();
  }
}

export default new AuthController();
