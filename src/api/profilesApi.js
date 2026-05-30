import apiGateway from '../gateway/apiGateway.js';

/**
 * Profiles API Client
 * Handles all profile/lead-related API calls
 */
class ProfilesApi {
  /**
   * Get all profiles for a session
   * GET /sessions/:sessionId/profiles
   * @param {string} sessionId - Session ID
   * @param {object} options - Query options
   * @param {number} options.limit - Number of results (default: 50)
   * @param {number} options.skip - Skip records (default: 0)
   * @returns {Promise<object>}
   */
  async getSessionProfiles(sessionId, options = {}) {
    try {
      const params = {
        limit: options.limit || 50,
        skip: options.skip || 0,
        ...options,
      };

      const response = await apiGateway.get(`/sessions/${sessionId}/profiles`, { params });
      return response.data;
    } catch (error) {
      console.error('[ProfilesApi] Get session profiles error:', error);
      throw error;
    }
  }

  /**
   * Get a single profile by ID
   * GET /profiles/:profileId
   * @param {string} profileId - Profile ID
   * @returns {Promise<object>}
   */
  async getProfileById(profileId) {
    try {
      const response = await apiGateway.get(`/profiles/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('[ProfilesApi] Get profile error:', error);
      throw error;
    }
  }

  /**
   * Batch save profiles
   * POST /sessions/:sessionId/profiles/batch
   * @param {string} sessionId - Session ID
   * @param {object} data - Request body
   * @param {array} data.profiles - Profiles to save
   * @param {string} data.mode - Save mode: 'enrich' | 'capture'
   * @returns {Promise<object>}
   */
  async batchSaveProfiles(sessionId, data) {
    try {
      const response = await apiGateway.post(`/sessions/${sessionId}/profiles/batch`, data);
      return response.data;
    } catch (error) {
      console.error('[ProfilesApi] Batch save profiles error:', error);
      throw error;
    }
  }

  /**
   * Batch update profiles
   * PUT /sessions/:sessionId/profiles/batch
   * @param {string} sessionId - Session ID
   * @param {object} data - Request body
   * @param {array} data.profiles - Profiles to update
   * @returns {Promise<object>}
   */
  async batchUpdateProfiles(sessionId, data) {
    try {
      const response = await apiGateway.put(`/sessions/${sessionId}/profiles/batch`, data);
      return response.data;
    } catch (error) {
      console.error('[ProfilesApi] Batch update profiles error:', error);
      throw error;
    }
  }

  /**
   * Delete all profiles for a session
   * DELETE /sessions/:sessionId/profiles
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>}
   */
  async deleteSessionProfiles(sessionId) {
    try {
      const response = await apiGateway.delete(`/sessions/${sessionId}/profiles`);
      return response.data;
    } catch (error) {
      console.error('[ProfilesApi] Delete session profiles error:', error);
      throw error;
    }
  }

  /**
   * Get all profiles across all sessions for authenticated user
   * GET /all
   * @param {object} options - Query options
   * @param {number} options.limit - Results per page (default: 100, max: 500)
   * @param {number} options.skip - Pagination offset (default: 0)
   * @returns {Promise<object>}
   */
  async getAllProfiles(options = {}) {
    try {
      const params = {
        limit: options.limit || 100,
        skip: options.skip || 0,
        ...options,
      };

      const response = await apiGateway.get('/all', { params });
      return response.data;
    } catch (error) {
      console.error('[ProfilesApi] Get all profiles error:', error);
      throw error;
    }
  }
}

export default new ProfilesApi();
