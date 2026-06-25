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
}

export default new SessionsApi();
