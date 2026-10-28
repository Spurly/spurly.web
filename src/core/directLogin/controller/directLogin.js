import directLoginGateway from '../gateway/directLogin.js';
import { DIRECT_LOGIN_EVENTS } from '../constants/constants.js';

/**
 * Direct-login controller. The only try/catch for this flow (besides the
 * gateway): it emits events; the hook subscribes.
 */

/** Step 1: ask for a code to the chosen email. Emits CODE_SENT { email } or CODE_FAILED. */
async function requestCode(eventEmitter, { email, password, confirmPassword }) {
  try {
    const data = await directLoginGateway.requestCode({ email, password, confirmPassword });
    eventEmitter.emit(DIRECT_LOGIN_EVENTS.CODE_SENT, { email: data.email || email });
  } catch (error) {
    eventEmitter.emit(DIRECT_LOGIN_EVENTS.CODE_FAILED, error);
  }
}

/** Step 2: confirm the code. Emits VERIFIED { user } (and stores it like login does) or VERIFY_FAILED. */
async function verifyCode(eventEmitter, code) {
  try {
    const user = await directLoginGateway.verifyCode(String(code || '').trim());
    if (user) localStorage.setItem('user', JSON.stringify(user.toJSON()));
    eventEmitter.emit(DIRECT_LOGIN_EVENTS.VERIFIED, { user });
  } catch (error) {
    eventEmitter.emit(DIRECT_LOGIN_EVENTS.VERIFY_FAILED, error);
  }
}

const directLoginController = { requestCode, verifyCode };

export default directLoginController;
