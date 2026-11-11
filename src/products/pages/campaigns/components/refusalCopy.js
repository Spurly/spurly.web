import { campaignsStrings } from '../strings.js';

/** The sentence for a refusal reason; unknown reasons still get a sentence (D97: never a raw code). */
export const refusalText = (reason) => campaignsStrings.refusals[reason] || campaignsStrings.fallbackRefusal;

/** The sentence for an API error code (or the server's own message when it is a readable sentence, else a fallback). */
export function poolErrorText(error) {
  const code = error?.response?.data?.code || error?.code;
  if (code && campaignsStrings.errors[code]) return campaignsStrings.errors[code];
  // The server writes plain sentences for its refusals; show one only when it reads like a sentence, never a bare code.
  const message = error?.response?.data?.message;
  if (typeof message === 'string' && /\s/.test(message) && /[a-z]/.test(message)) return message;
  return campaignsStrings.errors.fallback;
}
