/**
 * Turning a failed request into words.
 *
 * There are two audiences for a failure and they want different things, so
 * there are two functions here.
 *
 *   getToastError(err, label)   → a toast. Short, frontend-owned, names the
 *                                 action that failed.
 *   getApiErrorMessage(err, …)  → an inline block. Full server detail, for the
 *                                 person who has to act on it.
 *
 * THE RULE: a toast never relays a server message it hasn't vetted.
 *
 * This is the important inversion. Backends emit operator diagnostics —
 * "Switch GROQ_RESEARCH_MODEL to groq/compound-mini, or move the Groq account
 * off the free tier" — and a toast that echoes them hands a config note to
 * someone who just clicked a button. The caller's `label` is the default, and
 * server text has to earn its way past `readsAsProductCopy` to replace it.
 *
 * Genuinely user-facing messages ("Weekly invite limit reached") still get
 * through, because losing those would be its own regression. The gate is about
 * shape, not source.
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

/** Tokens that mark a string as written for an operator, not a user. */
const DIAGNOSTIC_PATTERNS = [
  /[A-Z][A-Z0-9]{2,}(_[A-Z0-9]+)+/, //  GROQ_RESEARCH_MODEL, API_KEY
  /[/\\{}<>=|`$]/, //                   groq/compound-mini, paths, templates
  /https?:\/\//, //                     URLs
  /\b(err|error|exception|stack|trace|undefined|null|NaN)\b:/i,
  /^\s*(TypeError|ReferenceError|SyntaxError|AxiosError|MongoError)/,
  /\b(env|config|process\.env|localhost|127\.0\.0\.1)\b/i,
  /\b\d{4,}\s*tokens?\b/i, //           "caps a single request at 6,000 tokens"
];

const MAX_TOAST_LENGTH = 90;

/**
 * Would a person who just clicked a button understand this, and is it about
 * *their* action rather than the deployment?
 *
 * Deliberately strict. A false negative costs a slightly vaguer toast; a false
 * positive puts an environment variable on someone's screen.
 */
function readsAsProductCopy(text) {
  if (typeof text !== 'string') return false;

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_TOAST_LENGTH) return false;

  /* Axios' own filler says nothing a user can act on. */
  if (/^request failed with status code/i.test(trimmed)) return false;

  return !DIAGNOSTIC_PATTERNS.some((pattern) => pattern.test(trimmed));
}

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
 * Toast copy. `label` is what the user sees unless the server has earned an
 * override.
 *
 * @param {unknown} err
 * @param {string} label - Names the action that failed, e.g.
 *                         "Couldn't research this lead". Required in spirit:
 *                         a call site with nothing specific to say is a smell.
 * @returns {string}
 */
export function getToastError(err, label = GENERIC) {
  /* Transport and auth failures override the label: "check your connection"
     and "your session expired" are more useful than the action name, and they
     tell the user the next click will fail too. */
  const transport = transportMessage(err);
  if (transport) return transport;

  const status = statusOf(err);
  if (status === 401 || status === 403 || status === 429) return BY_STATUS[status];

  const explicit = typeof err === 'object' && err !== null
    ? (err.response?.data?.userMessage ?? err.userMessage)
    : null;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();

  const server = extractServerMessage(err);
  if (server && readsAsProductCopy(server)) return server;

  return label;
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
  if (server && !/^request failed with status code/i.test(server)) return server;

  return BY_STATUS[statusOf(err)] ?? fallback;
}

export default getApiErrorMessage;
