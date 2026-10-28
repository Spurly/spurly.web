/**
 * "Set up a direct login" — a partner-managed account's person adds their own
 * email + password sign-in. Spurly branding only: no partner or vendor name.
 */
export const DIRECT_LOGIN_EVENTS = {
  CODE_SENT: 'DIRECT_LOGIN_CODE_SENT',
  CODE_FAILED: 'DIRECT_LOGIN_CODE_FAILED',
  VERIFIED: 'DIRECT_LOGIN_VERIFIED',
  VERIFY_FAILED: 'DIRECT_LOGIN_VERIFY_FAILED',
};

export const DIRECT_LOGIN_STEPS = {
  FORM: 'form',
  CODE: 'code',
};

export const DIRECT_LOGIN_COPY = {
  title: 'Direct login',
  intro: 'Sign in to Spurly with your own email and password, without opening the app you came from first. That app can still open this account too.',
  emailLabel: 'Your email',
  passwordLabel: 'Password',
  confirmLabel: 'Confirm password',
  passwordHint: 'At least 8 characters.',
  sendCode: 'Send code',
  sending: 'Sending…',
  codeIntro: (email) => `We sent a 6-digit code to ${email}. It expires in 10 minutes.`,
  codeLabel: 'Code',
  confirm: 'Confirm',
  confirming: 'Confirming…',
  back: 'Use a different email',
  resend: 'Send a new code',
  ready: (email) => `You can sign in at getspurly.com/login with ${email}, or with Google if that is a Google address.`,
  forgot: 'Forgot the password? Use "Forgot password" on the sign-in page.',
  success: 'Your direct login is ready',
  sendFailed: "Couldn't send the code",
  verifyFailed: "Couldn't confirm the code",
};
