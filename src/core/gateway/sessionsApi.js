import apiGateway from 'src/core/gateway/apiGateway.js';

class SessionsApi {
  async createFromProfiles({ sessionName, sessionDescription, profileIds }) {
    const response = await apiGateway.post('/sessions/from-profiles', {
      sessionName,
      sessionDescription,
      profileIds,
    });
    return response.data;
  }

  /**
   * Create an empty session.
   * POST /sessions  Body: { name, description? }
   * Returns the standard { success, message, data: session, status } envelope,
   * where data is the created session document (contains _id).
   */
  async createSession({ name, description }) {
    const response = await apiGateway.post('/sessions', { name, description });
    return response.data;
  }
}

export default new SessionsApi();
