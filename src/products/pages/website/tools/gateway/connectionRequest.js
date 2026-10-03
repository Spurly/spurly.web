import apiGateway from 'src/shared/gateway/apiGateway.js';

/** POST /public/tools/connection-request: no auth, rate limited by the server. */
async function createNote(input) {
  try {
    const response = await apiGateway.post('/public/tools/connection-request', input);
    const body = response.data;
    if (!body?.success) throw new Error(body?.message || 'Could not write the note');
    return body.data;
  } catch (error) {
    if (error.status === 0) {
      throw { status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server. Check your connection.' };
    }
    throw {
      status: error.status || 500,
      code: error.code || 'ERROR',
      message: error.message || 'Something went wrong. Please try again.',
      errors: error.errors || null,
    };
  }
}

const connectionRequestGateway = { createNote };
export default connectionRequestGateway;
