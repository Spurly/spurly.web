import apiGateway from 'src/core/gateway/apiGateway.js';
import { AuthResponse, User } from 'src/core/entities/User.js';

/**
 * Auth API Client
 * Handles all authentication-related API calls
 * Layer between controllers and gateway
 */

class AuthApi {
  /**
   * Register new user
   * POST /auth/register
   * @param {string} name - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} confirmPassword - Password confirmation
   * @returns {Promise<AuthResponse>}
   */
  async register({ name, email, password, confirmPassword }) {
    try {
      const response = await apiGateway.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword,
      });

      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Login user
   * POST /auth/login
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<AuthResponse>}
   */
  async login({ email, password }) {
    try {
      const response = await apiGateway.post('/auth/login', {
        email,
        password,
      });

      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Step 1 of OTP signup: validate details and email a 6-digit code.
   * No account is created yet.
   * POST /auth/signup/request-otp
   * @param {Object} params - { name, email, password, confirmPassword, referralCode? }
   * @returns {Promise<AuthResponse>} data: { email }
   */
  async requestSignupOtp({ name, email, password, confirmPassword, referralCode }) {
    try {
      const response = await apiGateway.post('/auth/signup/request-otp', {
        name,
        email,
        password,
        confirmPassword,
        referralCode,
      });

      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Step 2 of OTP signup: verify the code and create the account (signed in).
   * POST /auth/signup/verify-otp
   * @param {Object} params - { email, code }
   * @returns {Promise<AuthResponse>} data: { user, token }
   */
  async verifySignupOtp({ email, code }) {
    try {
      const response = await apiGateway.post('/auth/signup/verify-otp', {
        email,
        code,
      });

      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Request a password reset code (emailed to the user).
   * POST /auth/forgot-password
   * @param {Object} params - { email }
   * @returns {Promise<AuthResponse>}
   */
  async forgotPassword({ email }) {
    try {
      const response = await apiGateway.post('/auth/forgot-password', { email });
      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Set a new password using the emailed 6-digit code (signed in on success).
   * POST /auth/reset-password
   * @param {Object} params - { email, code, password, confirmPassword }
   * @returns {Promise<AuthResponse>} data: { user, token }
   */
  async resetPassword({ email, code, password, confirmPassword }) {
    try {
      const response = await apiGateway.post('/auth/reset-password', {
        email,
        code,
        password,
        confirmPassword,
      });

      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Complete the onboarding survey ("Tell us about you" step).
   * POST /auth/onboarding
   * @param {Object} data - { role, teamSizeRange, primaryGoal, monthlyActivity, companyName, companyWebsite? }
   * @returns {Promise<User>} The updated user
   */
  async completeOnboarding(data) {
    try {
      const response = await apiGateway.post('/auth/onboarding', data);
      // /auth/onboarding returns the user directly in `data` (not data.user)
      const userData = response.data?.data;
      if (!userData) {
        throw new Error(response.data?.message || 'Could not save your details');
      }
      return User.fromResponse(userData);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Logout user
   * POST /auth/logout
   * @returns {Promise<AuthResponse>}
   */
  async logout() {
    try {
      const response = await apiGateway.post('/auth/logout');
      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get current user profile
   * GET /auth/me
   * @returns {Promise<User>}
   */
  async getCurrentUser() {
    try {
      const response = await apiGateway.get('/auth/me');
      // /auth/me returns the user directly in `data` (not data.user)
      const userData = response.data?.data;
      return userData ? User.fromResponse(userData) : null;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Update user profile
   * PUT /auth/profile
   * @param {object} profileData - Profile data to update
   * @returns {Promise<User>}
   */
  async updateProfile(profileData) {
    try {
      const response = await apiGateway.put('/auth/profile', profileData);
      // /auth/profile returns the user directly in `data` (not data.user)
      const userData = response.data?.data;
      return userData ? User.fromResponse(userData) : null;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get LinkedIn OAuth request URL
   * GET /auth/linkedin/request
   * @returns {Promise<string>} - Redirect URL
   */
  async getLinkedInAuthUrl() {
    try {
      // client=web tells the backend callback to set an httpOnly cookie and
      // redirect to the dashboard (instead of the extension's postMessage flow)
      const response = await apiGateway.get('/auth/linkedin/request?client=web');
      const authResponse = AuthResponse.fromResponse(response.data);
      return authResponse.data?.redirectUrl;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get the Google OAuth authorization URL (web flow).
   * GET /auth/google/request?client=web
   * @returns {Promise<string>} The Google redirect URL
   */
  async getGoogleAuthUrl() {
    try {
      const response = await apiGateway.get('/auth/google/request?client=web');
      const authResponse = AuthResponse.fromResponse(response.data);
      return authResponse.data?.redirectUrl;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * LinkedIn OAuth callback
   * POST /auth/linkedin/callback
   * @param {string} code - Authorization code from LinkedIn
   * @returns {Promise<AuthResponse>}
   */
  async linkedinCallback(code) {
    try {
      const response = await apiGateway.post('/auth/linkedin/callback', { code });
      return AuthResponse.fromResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Link LinkedIn account to existing user
   * POST /auth/link-linkedin
   * @param {string} code - Authorization code from LinkedIn
   * @returns {Promise<User>}
   */
  async linkLinkedInAccount(code) {
    try {
      const response = await apiGateway.post('/auth/link-linkedin', { code });
      const authResponse = AuthResponse.fromResponse(response.data);
      return authResponse.getUser();
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Handle and format errors
   * @private
   */
  _handleError(error) {
    // Network error
    if (error.status === 0) {
      return {
        status: 0,
        message: 'Cannot reach server - check your connection',
        code: 'NETWORK_ERROR',
      };
    }

    // Backend validation/auth errors
    if (error.message) {
      return {
        status: error.status || 500,
        message: error.message,
        code: error.code || 'ERROR',
      };
    }

    // Default error
    return {
      status: 500,
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }
}

export default new AuthApi();
