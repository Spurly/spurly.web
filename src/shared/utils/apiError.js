/**
 * Turning a failed request into words.
 *
 * THE RULE: whatever the server said went wrong is what the person sees.
 *
 * A vague "Couldn't do that" hides the one thing the person can act on ("This email
 * already has a Spurly account", "Weekly invite limit reached"). So the server's own
 * message is shown as written, in toasts and inline blocks alike. The caller's `label`
 * is only the fallback for when the server said nothing usable (no message, or axios'
 * "Request failed with status code 500" filler). Transport failures and an expired
 * session still get their own plain wording, because those are not about the action.
 *
 *   getToastError(err, label)   -> a toast
 *   getApiErrorMessage(err, …)  -> an inline block
 *
 * Both now relay the server message; they differ only in the fallback and in how
 * a 401 / 429 is worded.
 */

const GENERIC = 'Something went wrong. Please try again.';

/** Status codes specific enough to say something true and short about. */
const BY_STATUS = {
  401: 'Your session expired. Sign in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: 'That conflicts with something that already exists.',
  413: 'That file is too large to upload.',
  429: 'Too many requests. Wait a moment and try again.',
  500: 'The server ran into a problem. Try again.',
  502: 'The server is unreachable right now. Try again.',
  503: 'The service is temporarily unavailable. Try again shortly.',
  504: 'The request timed out. Try again.',
};

/** Axios' own filler says nothing a user can act on. */
const isFiller = (text) => /^request failed with status code/i.test(String(text).trim());

/** Pull the most specific string the payload offers, wherever it's hiding. */
function extractServerMessage(err) {
  if (typeof err === 'string') return err.trim() || null;
  if (!err) return null;

  const body = err.response?.data ?? err;
  const firstValidation = Array.isArray(body?.errors) ? body.errors[0] : null;

  const candidates = [
    /* An explicit opt-in from the backend: "this one is for the user". Trusted
       without the shape check, because someone chose to write it for them. */
    body?.userMessage,
    body?.message,
    body?.error?.message,
    typeof body?.error === 'string' ? body.error : null,
    firstValidation?.msg ?? firstValidation?.message,
    err.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

function statusOf(err) {
  return err?.status ?? err?.statusCode ?? err?.response?.status;
}

/** Connection-level failures, which have nothing to do with the endpoint. */
function transportMessage(err) {
  const status = statusOf(err);
  if (status === 0 || err?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your connection.';
  }
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Try again.';
  return null;
}

/**
 * Toast copy: the server's message as written, else `label`.
 *
 * @param {unknown} err
 * @param {string} label - Names the action that failed, e.g. "Couldn't research this lead".
 *                         Shown only when the server gave nothing usable.
 * @returns {string}
 */
export function getToastError(err, label = GENERIC) {
  /* Connection failures and an expired session are about the next click, not this one. */
  const transport = transportMessage(err);
  if (transport) return transport;

  const status = statusOf(err);
  if (status === 401) return BY_STATUS[401];

  const server = extractServerMessage(err);
  if (server && !isFiller(server)) return server;

  return BY_STATUS[status] ?? label;
}

/**
 * Inline copy — the full server message, kept intact.
 *
 * For the dismissible blocks that sit next to the thing that failed, where
 * there's room to read and the detail is the whole point (a bad CSV column, a
 * misconfigured model, an out-of-date extension).
 *
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function getApiErrorMessage(err, fallback = GENERIC) {
  if (!err) return fallback;

  const transport = transportMessage(err);
  if (transport) return transport;

  const server = extractServerMessage(err);
  if (server && !isFiller(server)) return server;

  return BY_STATUS[statusOf(err)] ?? fallback;
}

export default getApiErrorMessage;
