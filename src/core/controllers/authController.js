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
   * Get LinkedIn OAuth redirect URL
   * @returns {Promise<string>}
   */
  async getLinkedInAuthUrl() {
    return await authApi.getLinkedInAuthUrl();
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
