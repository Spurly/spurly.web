import apiGateway from 'src/shared/gateway/apiGateway.js';
import { AuthResponse } from 'src/core/auth/entities/User.js';

/**
 * Partner gateway: the one public call behind "Open in Spurly".
 */

/**
 * Exchange a one-time ticket for a session.
 * POST /partner/session
 * @param {string} ticket
 * @returns {Promise<AuthResponse>} data: { user, token, managed }
 */
async function exchangeTicket(ticket) {
  try {
    const response = await apiGateway.post('/partner/session', { ticket });
    return AuthResponse.fromResponse(response.data);
  } catch (error) {
    throw handleError(error);
  }
}

/** @private */
function handleError(error) {
  if (error.status === 0) {
    return { status: 0, message: 'Cannot reach server - check your connection', code: 'NETWORK_ERROR' };
  }
  if (error.message) {
    return { status: error.status || 500, message: error.message, code: error.code || 'ERROR' };
  }
  return { status: 500, message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' };
}

const partnerGateway = { exchangeTicket };

export default partnerGateway;
