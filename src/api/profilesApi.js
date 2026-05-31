import apiGateway from 'src/gateway/apiGateway.js';
import { ProfilesResponse, Profile } from 'src/entities/Profile.js';

/**
 * Profiles API Client
 * Handles all profile-related API calls
 * Layer between hooks and gateway
 */

class ProfilesApi {
  /**
   * Get all profiles with pagination
   * GET /profiles/all
   * @param {object} options - Query options
   * @param {number} options.limit - Items per page (default: 50)
   * @param {number} options.skip - Items to skip (default: 0)
   * @returns {Promise<ProfilesResponse>}
   */
  async getAllProfiles(options = {}) {
    try {
      const { limit = 50, skip = 0 } = options;
      const params = new URLSearchParams();

      if (limit) params.append('limit', limit);
      if (skip) params.append('skip', skip);

      const url = `/profiles/all?${params.toString()}`;
      const response = await apiGateway.get(url);

      return ProfilesResponse.fromResponse(response.data);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get single profile by ID
   * GET /profiles/:id
   * @param {string} profileId - Profile ID
   * @returns {Promise<Profile>}
   */
  async getProfile(profileId) {
    try {
      const response = await apiGateway.get(`/profiles/${profileId}`);
      return Profile.fromResponse(response.data?.data || response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Create new profile
   * POST /profiles
   * @param {object} profileData - Profile data
   * @returns {Promise<Profile>}
   */
  async createProfile(profileData) {
    try {
      const response = await apiGateway.post('/profiles', profileData);
      return Profile.fromResponse(response.data?.data || response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Update profile
   * PUT /profiles/:id
   * @param {string} profileId - Profile ID
   * @param {object} profileData - Updated profile data
   * @returns {Promise<Profile>}
   */
  async updateProfile(profileId, profileData) {
    try {
      const response = await apiGateway.put(`/profiles/${profileId}`, profileData);
      return Profile.fromResponse(response.data?.data || response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Delete profile
   * DELETE /profiles/:id
   * @param {string} profileId - Profile ID
   * @returns {Promise<boolean>}
   */
  async deleteProfile(profileId) {
    try {
      await apiGateway.delete(`/profiles/${profileId}`);
      return true;
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
        success: false,
        message: 'Cannot reach server - check your connection',
        code: 'NETWORK_ERROR',
        data: null,
      };
    }

    // Backend validation/auth errors
    if (error.message) {
      return {
        success: false,
        message: error.message,
        code: error.code || 'ERROR',
        data: null,
      };
    }

    // Default error
    return {
      success: false,
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      data: null,
    };
  }
}

export default new ProfilesApi();
