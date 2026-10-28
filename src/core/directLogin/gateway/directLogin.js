import apiGateway from 'src/shared/gateway/apiGateway.js';
import { User } from 'src/core/auth/entities/User.js';

/**
 * Direct-login gateway (partner-managed accounts).
 *   POST /auth/direct-login/request  { email, password, confirmPassword } -> { email, expiresInMinutes }
 *   POST /auth/direct-login/verify   { code }                             -> user
 */

async function requestCode({ email, password, confirmPassword }) {
  try {
    const response = await apiGateway.post('/auth/direct-login/request', { email, password, confirmPassword });
    return response.data?.data || {};
  } catch (error) {
    throw toError(error);
  }
}

async function verifyCode(code) {
  try {
    const response = await apiGateway.post('/auth/direct-login/verify', { code });
    const data = response.data?.data;
    return data ? User.fromResponse(data) : null;
  } catch (error) {
    throw toError(error);
  }
}

/** The API answers { message, error: CODE }; network failures arrive with status 0. */
function toError(error) {
  if (error?.status === 0) return { status: 0, message: 'Cannot reach server - check your connection', code: 'NETWORK_ERROR' };
  return { status: error?.status || 500, message: error?.message || 'Something went wrong', code: error?.error || error?.code || 'ERROR' };
}

const directLoginGateway = { requestCode, verifyCode };

export default directLoginGateway;
