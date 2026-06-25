import sessionsApi from 'src/core/gateway/sessionsApi.js';

class SessionsController {
  async createFromProfiles({ sessionName, sessionDescription, profileIds }) {
    const res = await sessionsApi.createFromProfiles({ sessionName, sessionDescription, profileIds });
    if (!res?.success) throw new Error(res?.message || 'Failed to create session');
    return res.data;
  }
}

export default new SessionsController();
