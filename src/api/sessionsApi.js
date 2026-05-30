import apiGateway from '../gateway/apiGateway.js';

/**
 * Sessions API Client
 * Handles all session management API calls
 */
class SessionsApi {
  /**
   * Create a new session
   * POST /sessions
   * @param {object} sessionData - Session data
   * @param {string} sessionData.name - Session name
   * @param {string} sessionData.description - Session description (optional)
   * @param {string} sessionData.status - Session status (optional)
   * @param {object} sessionData.metadata - Session metadata (optional)
   * @returns {Promise<object>}
   */
  async createSession(sessionData) {
    try {
      const response = await apiGateway.post('/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('[SessionsApi] Create session error:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for authenticated user
   * GET /sessions
   * @param {object} options - Query options
   * @param {string} options.status - Filter by status
   * @param {number} options.limit - Number of results
   * @param {number} options.skip - Skip records
   * @returns {Promise<object>}
   */
  async listSessions(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.limit) params.append('limit', options.limit);
      if (options.skip) params.append('skip', options.skip);

      const response = await apiGateway.get('/sessions', { params: Object.fromEntries(params) });
      return response.data;
    } catch (error) {
      console.error('[SessionsApi] List sessions error:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   * GET /sessions/stats
   * @returns {Promise<object>}
   */
  async getStats() {
    try {
      const response = await apiGateway.get('/sessions/stats');
      return response.data;
    } catch (error) {
      console.error('[SessionsApi] Get stats error:', error);
      throw error;
    }
  }

  /**
   * Get a specific session
   * GET /sessions/:sessionId
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>}
   */
  async getSession(sessionId) {
    try {
      const response = await apiGateway.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('[SessionsApi] Get session error:', error);
      throw error;
    }
  }

  /**
   * Update a session
   * PUT /sessions/:sessionId
   * @param {string} sessionId - Session ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>}
   */
  async updateSession(sessionId, updateData) {
    try {
      const response = await apiGateway.put(`/sessions/${sessionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('[SessionsApi] Update session error:', error);
      throw error;
    }
  }

  /**
   * Delete a session
   * DELETE /sessions/:sessionId
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>}
   */
  async deleteSession(sessionId) {
    try {
      const response = await apiGateway.delete(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('[SessionsApi] Delete session error:', error);
      throw error;
    }
  }
}

export default new SessionsApi();
