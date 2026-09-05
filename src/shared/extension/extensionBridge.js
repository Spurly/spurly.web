/**
 * Extension bridge (web side)
 *
 * Talks to the Spurly extension's content-script bridge over window.postMessage.
 * The web page never needs the extension id: the bridge is injected on this
 * origin and relays to the extension's background worker.
 *
 *   web  → { __spurly:'request',  id, action, payload }
 *   web  ← { __spurly:'response', id, ok, data, error }
 *   web  ← { __spurly:'event',    action, payload }        (progress/complete)
 *   web  ← { __spurly:'ready',    version, loggedIn }      (bridge announce)
 */

import apiGateway from 'src/shared/gateway/apiGateway.js';

const ACTIONS = {
  PING: 'EXT_PING',
  START: 'CAMPAIGN_START',
  STOP: 'CAMPAIGN_STOP',
  PROGRESS: 'CAMPAIGN_PROGRESS',
  COMPLETE: 'CAMPAIGN_COMPLETE',
  // Imported-lead enrichment (Import tab)
  ENRICH_START: 'ENRICH_START',
  ENRICH_STOP: 'ENRICH_STOP',
  ENRICH_STATE: 'GET_ENRICH_STATE',
  ENRICH_PROGRESS: 'ENRICH_PROGRESS',
  ENRICH_COMPLETE: 'ENRICH_COMPLETE',
  // Single sign-on: hand this browser session to the extension
  AUTH_SYNC: 'AUTH_SYNC',
  AUTH_CLEAR: 'AUTH_CLEAR',
  // Manual "Sync now" on the Connections tab
  SYNC_START: 'SYNC_CONNECTIONS_START',
  SYNC_STATE: 'GET_SYNC_CONNECTIONS_STATE',
  SYNC_COMPLETE: 'SYNC_CONNECTIONS_COMPLETE',
};

/**
 * Oldest extension build that can run imported-lead enrichment.
 *
 * Version-gating matters here because the failure mode is otherwise silent and
 * very confusing: an older build's bridge does not recognise ENRICH_START, so
 * the request is dropped and the page just times out — identical to "extension
 * not installed". Checking the version up front turns that into a sentence
 * that says what to do.
 */
export const MIN_ENRICH_VERSION = '1.2.0';

/** -1 / 0 / 1, comparing dotted numeric version strings. */
export function compareVersions(a = '', b = '') {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/** Does this reported extension version support enrichment? */
export function supportsEnrichment(version) {
  if (!version) return false;
  return compareVersions(version, MIN_ENRICH_VERSION) >= 0;
}

const pending = new Map(); // id -> { resolve }
const eventListeners = new Set();
let seq = 0;

/**
 * Turn a bridge-level error code into something a user can act on.
 *
 * Two of these are protocol codes rather than descriptions, because the raw
 * browser text is actively misleading:
 *
 * - EXTENSION_RELOADED: the extension was updated or reloaded while this tab was
 *   open, so the injected bridge is orphaned. Chrome words this as "Extension
 *   context invalidated", which reads like the request failed — it never left.
 *   Only a page reload re-injects the bridge.
 * - UNSUPPORTED_ACTION: an older build's bridge doesn't know this action.
 *
 * @param {string} error
 * @param {string} fallback
 */
export function describeBridgeError(error, fallback = 'Extension error') {
  const code = String(error || '');
  if (code.startsWith('EXTENSION_RELOADED')) {
    return 'Reload this page — the Spurly extension was updated since you opened it';
  }
  if (code.startsWith('UNSUPPORTED_ACTION')) {
    return 'Update the Spurly extension to use this feature';
  }
  return code || fallback;
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || typeof d !== 'object' || !d.__spurly) return;

    if (d.__spurly === 'response' && pending.has(d.id)) {
      const { resolve } = pending.get(d.id);
      pending.delete(d.id);
      resolve(d);
    } else if (d.__spurly === 'event') {
      eventListeners.forEach((cb) => {
        try {
          cb(d);
        } catch (_) {
          /* listener errors are their own problem */
        }
      });
    }
    // 'ready' broadcasts are informational; detection uses an active ping().
  });
}

/**
 * The worker's two ways of saying the same thing: `{ started:false, error }`
 * from the campaign/enrichment paths, `{ ran:false, reason }` from the
 * connections sweep.
 */
function looksSignedOut(result) {
  return /not logged in/i.test(String(result?.error || result?.reason || ''));
}

/**
 * Run a bridge action, and if the extension says it is signed out, hand it this
 * browser's session and try once more.
 *
 * Sign-on is a push from this page, so the extension can be signed out at a
 * moment this page has no reason to push: the user signed out inside the panel,
 * or cleared extension storage, while this tab stayed open. They then press
 * Sync now and get "not logged in" — from an app that is plainly showing them
 * signed in. Repairing it here means the session is re-handed at the one moment
 * we know for certain it is needed, instead of waiting for the next page load.
 *
 * Only ever one retry: if the session we just pushed still isn't good enough,
 * the failure is real and the caller should see it.
 */
async function withSessionRetry(run) {
  const first = await run();
  if (!looksSignedOut(first)) return first;

  const { synced } = await syncAuthToExtension();
  if (!synced) return first;

  return run();
}

/** Low-level request/response with a timeout. Resolves null on timeout. */
function request(action, payload = {}, timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const id = `spurly-${Date.now()}-${seq++}`;
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        resolve(null); // no bridge / no extension
      }
    }, timeoutMs);

    pending.set(id, {
      resolve: (msg) => {
        clearTimeout(timer);
        resolve(msg);
      },
    });

    window.postMessage({ __spurly: 'request', id, action, payload }, window.location.origin);
  });
}

/**
 * True if the extension's content-script bridge is present on this page. Read
 * from a DOM marker the bridge sets synchronously at document_start, so it does
 * NOT depend on the (often-asleep) service worker. This is the reliable
 * "installed & enabled" signal.
 */
export function isExtensionPresent() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.hasAttribute('data-spurly-ext')
  );
}

/**
 * Probe for the extension. Resolves { installed, loggedIn, version }.
 * `installed` comes from the DOM marker (reliable); login/version come from a
 * best-effort ping that wakes the service worker (may be slow/unavailable).
 */
export async function pingExtension(timeoutMs = 3000) {
  const present = isExtensionPresent();
  const res = await request(ACTIONS.PING, {}, timeoutMs);

  // Installed but signed out, while this page holds a session: hand it over.
  // This is what keeps the extension's status from sitting on "Signed out" —
  // and every action behind it from failing — after someone signs out inside
  // the panel with this tab already open.
  //
  // A successful push IS the answer, so there is no second ping. This function
  // is awaited on paths the user is watching (the Send button, Enrich, the
  // status pill), and a third round trip there buys nothing: the extension
  // only answers `synced` after it has verified the token and written it.
  if (res && res.ok && res.data?.installed && !res.data.loggedIn) {
    const { synced } = await syncAuthToExtension(2500);
    if (synced) {
      return {
        installed: true,
        loggedIn: true,
        loginKnown: true,
        version: res.data.version || null,
      };
    }
  }

  if (res && res.ok && res.data?.installed) {
    // Definitive answer from the worker — login state is known.
    return {
      installed: true,
      loggedIn: !!res.data.loggedIn,
      loginKnown: true,
      version: res.data.version || null,
    };
  }
  // Worker asleep or slow to answer. Trust the DOM marker for presence, but
  // login is UNKNOWN (not "logged out") — callers must not show a "sign in"
  // warning just because the ping didn't come back in time.
  return { installed: present, loggedIn: false, loginKnown: false, version: null };
}

/**
 * Ask the extension to start sending a campaign.
 * Resolves { started, total?, error? }. started:false + a message when it
 * couldn't begin (not installed, not logged in, nothing pending, etc).
 */
export async function startCampaign(campaignId, timeoutMs = 3000) {
  // A real wake + queue fetch answers in ~1s; keep the timeout short so the
  // caller can retry quickly when a message to a sleeping worker is dropped.
  return withSessionRetry(async () => {
    const res = await request(ACTIONS.START, { campaignId }, timeoutMs);
    if (!res) return { started: false, error: 'Extension did not respond' };
    if (!res.ok) return { started: false, error: describeBridgeError(res.error) };
    return res.data || { started: false, error: 'No response' };
  });
}

/** Ask the extension to stop the running campaign. */
export async function stopCampaign() {
  const res = await request(ACTIONS.STOP, {}, 3000);
  return res?.data || { stopped: false };
}

/**
 * Subscribe to progress/completion events. Callback gets { action, payload }.
 * Returns an unsubscribe function.
 */
export function onCampaignEvent(cb) {
  eventListeners.add(cb);
  return () => eventListeners.delete(cb);
}

/**
 * Same subscription as onCampaignEvent — every bridge event goes to every
 * listener, so callers filter on `action` themselves. Exported under a neutral
 * name because enrichment events flow through here too.
 */
export const onExtensionEvent = onCampaignEvent;

export const CAMPAIGN_EVENTS = { PROGRESS: ACTIONS.PROGRESS, COMPLETE: ACTIONS.COMPLETE };

/**
 * Ask the extension to drain the imported-lead enrichment queue.
 *
 * The queue itself lives on the backend — the page only says "go", so a run
 * of 500 leads doesn't have to be squeezed through a postMessage payload.
 * Resolves { started, total? } or { started:false, error }.
 */
export async function startEnrichment(timeoutMs = 5000) {
  // Opening the first tab and fetching the queue takes a beat longer than a
  // campaign start, so this timeout is a little more generous.
  return withSessionRetry(async () => {
    const res = await request(ACTIONS.ENRICH_START, {}, timeoutMs);
    if (!res) return { started: false, error: 'Extension did not respond' };
    if (!res.ok) return { started: false, error: describeBridgeError(res.error) };
    return res.data || { started: false, error: 'No response' };
  });
}

/** Ask the extension to abort the running enrichment. */
export async function stopEnrichment() {
  const res = await request(ACTIONS.ENRICH_STOP, {}, 3000);
  return res?.data || { stopped: false };
}

/**
 * Is an enrichment run still in flight? Used on mount, because the Import page
 * unmounts on navigation while the background worker keeps going.
 * Resolves { running, current, total }.
 */
export async function getEnrichmentState() {
  const res = await request(ACTIONS.ENRICH_STATE, {}, 2000);
  return res?.data || { running: false, current: 0, total: 0 };
}

export const ENRICH_EVENTS = {
  PROGRESS: ACTIONS.ENRICH_PROGRESS,
  COMPLETE: ACTIONS.ENRICH_COMPLETE,
};

/**
 * Ask the extension to read the LinkedIn connections page now, rather than
 * waiting for its daily run.
 *
 * Resolves as soon as the sweep STARTS, not when it finishes — a full sweep
 * runs for minutes, well past any sane request timeout. The outcome arrives
 * later as a SYNC_CONNECTIONS_COMPLETE event; subscribe with onExtensionEvent.
 *
 * Resolves { started, error? }.
 */
export async function startConnectionsSync(timeoutMs = 5000) {
  return withSessionRetry(async () => {
    const res = await request(ACTIONS.SYNC_START, {}, timeoutMs);
    if (!res) return { started: false, error: 'Extension did not respond' };
    if (!res.ok) return { started: false, error: describeBridgeError(res.error) };
    return res.data || { started: false, error: 'No response' };
  });
}

/**
 * Is a connections sweep still in flight? Used on mount, because the page
 * unmounts on navigation while the background worker keeps going.
 * Resolves { running }.
 */
export async function getConnectionsSyncState() {
  const res = await request(ACTIONS.SYNC_STATE, {}, 2000);
  return res?.data || { running: false };
}

export const SYNC_EVENTS = { COMPLETE: ACTIONS.SYNC_COMPLETE };

/**
 * Hand this browser session to the extension (single sign-on).
 *
 * The web app is the only place the user types credentials. Whenever it holds a
 * session it pushes the JWT across, and the extension's side panel comes up
 * already signed in — no second login, and no way for the two to end up on
 * different accounts.
 *
 * Deliberately quiet: SSO is a convenience layered on top of a sign-in that
 * already succeeded here, so nothing about it should surface an error to
 * someone who may not even have the extension installed. A build older than
 * this feature answers UNSUPPORTED_ACTION and is swallowed the same way — it
 * still has its own sign-in screen, so the worst case is the old behaviour. The extension
 * verifies the token against the backend before storing it.
 *
 * Resolves { synced, reason? } and never rejects.
 */
let authSyncInFlight = null;

export async function syncAuthToExtension(timeoutMs = 4000) {
  // Two callers fire on the same page load — AuthContext's mount effect and
  // DashboardLayout's status ping — and both read the extension's stored token
  // before either has written, so both miss the extension's no-op path and both
  // make it verify against /auth/me. Share one push instead.
  if (authSyncInFlight) return authSyncInFlight;
  authSyncInFlight = runAuthSync(timeoutMs).finally(() => {
    authSyncInFlight = null;
  });
  return authSyncInFlight;
}

/**
 * Same token, two backends.
 *
 * The extension asks ITS OWN API whether a pushed token is good, so a token
 * minted by a different API is "invalid" no matter how healthy the session is.
 * Web and extension are built separately, from separate env files, which makes
 * this easy to reach — a dev build of one against a release build of the other
 * — and impossible to read from the outside: all you get is a 401.
 *
 * Returns a clause to append to the failure line, or '' when both halves agree
 * (or when there is nothing to compare).
 */
function describeApiMismatch(theirApi) {
  try {
    if (!theirApi) return '';
    const ours = apiGateway.getBaseUrl();
    if (!ours) return '';
    const theirOrigin = new URL(theirApi, window.location.origin).origin;
    const ourOrigin = new URL(ours, window.location.origin).origin;
    if (theirOrigin === ourOrigin) return '';
    return (
      ` — the extension verifies tokens against ${theirApi} but this app talks to ${ours}. ` +
      'Rebuild the extension against the same backend.'
    );
  } catch (_) {
    // A malformed base URL must not turn a real reason into a thrown one:
    // runAuthSync's catch would report THREW and lose the diagnosis entirely.
    return '';
  }
}

async function runAuthSync(timeoutMs) {
  try {
    const result = await pushAuthToExtension(timeoutMs);
    // The handoff is silent by design — it must never put an error in front of
    // someone whose sign-in worked. But silent also meant undiagnosable: the
    // one symptom of a failed push is the extension sitting on "Signed out",
    // which looks identical whatever the cause. One console line, only when
    // the page HAS a session (so it can't nag people who simply don't have the
    // extension), turns that into an answer.
    if (!result.synced && result.reason !== 'NOT_INSTALLED' && result.reason !== 'NO_SESSION') {
      console.warn(`[spurly] extension sign-in handoff failed: ${result.reason}${describeApiMismatch(result.api)}`);
    }
    return result;
  } catch (err) {
    // This function must never reject. Its one realistic throw is reading
    // localStorage in a browser set to block site data — and because callers
    // share one in-flight promise, a single rejection would fan out to all of
    // them: pingExtension would reject, and the status pill it feeds has no
    // catch, so it would sit on "Checking…" forever.
    return { synced: false, reason: err?.message || 'THREW' };
  }
}

/**
 * A bearer token for THIS browser session, minted on demand.
 *
 * Google and LinkedIn sign-ins never leave a readable JWT behind: the backend
 * sets it as an httpOnly cookie and redirects into the app. Every request the
 * page makes still authenticates — the cookie rides along — but there is
 * nothing for `getToken()` to return, so the handoff used to stop here with
 * NO_TOKEN. The result was the bug this exists to fix: the extension sat on
 * "Signed out" permanently and every action behind it failed "Not logged in to
 * Spurly", in an app that was plainly showing the user signed in. Nothing
 * short of signing in again with a password could clear it, because a push
 * that has no token to push never gets closer to succeeding.
 *
 * `GET /auth/session-token` exists for exactly this: the auth middleware
 * verifies the cookie, and the route mints a fresh JWT for the same user.
 *
 * The minted token is kept in MEMORY only, never localStorage. The cookie is
 * httpOnly by deliberate choice — so page scripts cannot read the credential —
 * and writing a copy of it into localStorage would undo that decision as a
 * side effect of a caching convenience. Here it dies with the tab.
 *
 * Cached because a push runs on every page load and on both hot paths, and
 * each miss is a network round trip on a path the user is watching. It is
 * cleared on sign-out, which is the only way one tab reaches a second account
 * without a page load — the gateway's 401 handler does a full reload.
 */
let mintedSession = null;
let mintInFlight = null;

function resetMintedSession() {
  mintedSession = null;
}

async function mintSessionToken() {
  if (mintedSession) return mintedSession;
  if (mintInFlight) return mintInFlight;

  mintInFlight = apiGateway
    .get('/auth/session-token')
    .then((res) => {
      // { success, message, data: { user, token }, status }
      const payload = res?.data?.data || {};
      if (!payload.token) return null;
      mintedSession = { token: payload.token, user: payload.user || null };
      return mintedSession;
    })
    // A backend older than this route answers 404, an expired cookie 401, and
    // an offline browser nothing at all. All three mean the same thing here:
    // no token to hand over, same as before this existed.
    .catch(() => null)
    .finally(() => {
      mintInFlight = null;
    });

  return mintInFlight;
}

/**
 * Does this page believe it holds a session at all?
 *
 * Guards the mint: asking for a token while signed out earns a 401, and the
 * gateway's 401 handler redirects to /login. Every caller of this module sits
 * behind a route guard today, so that would take a real bug to reach — but the
 * cost of the check is one localStorage read and the cost of missing it is
 * bouncing someone out of the app.
 */
function hasWebSession() {
  if (apiGateway.getToken()) return true;
  try {
    return !!localStorage.getItem('user');
  } catch (_) {
    return false;
  }
}

async function pushAuthToExtension(timeoutMs) {
  if (!isExtensionPresent()) return { synced: false, reason: 'NOT_INSTALLED' };

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (_) {
    /* a corrupt cached user is not worth failing the handoff over — the
       extension re-reads the profile from /auth/me anyway */
  }

  let token = apiGateway.getToken();
  if (!token) {
    if (!hasWebSession()) return { synced: false, reason: 'NO_SESSION' };
    const minted = await mintSessionToken();
    if (!minted) return { synced: false, reason: 'NO_TOKEN' };
    token = minted.token;
    // The route returns the verified user alongside the token, which is the
    // better source than a cached copy that may predate a profile edit.
    user = minted.user || user;
  }

  const res = await request(ACTIONS.AUTH_SYNC, { token, user }, timeoutMs);
  if (!res) return { synced: false, reason: 'NO_RESPONSE' };
  if (!res.ok) return { synced: false, reason: res.error || 'BRIDGE_ERROR' };
  if (!res.data?.ok) {
    // `api` is the extension's own backend. It only comes back on rejections
    // that involved a call to it, and it is what distinguishes a genuinely bad
    // session from the two halves being aimed at different backends.
    return { synced: false, reason: res.data?.error || 'REJECTED', api: res.data?.api || null };
  }
  return { synced: true, unchanged: !!res.data.unchanged };
}

/**
 * Tell the extension this session has ended, so signing out of the web app
 * signs the panel out too. Same quiet contract as syncAuthToExtension.
 */
export async function clearExtensionAuth(timeoutMs = 3000) {
  // Drop the minted token whether or not the extension is here to hear about
  // it: this tab may sign in as someone else next, and a cached token for the
  // account that just left would be handed over as if it were theirs.
  resetMintedSession();
  if (!isExtensionPresent()) return { cleared: false, reason: 'NOT_INSTALLED' };
  const res = await request(ACTIONS.AUTH_CLEAR, {}, timeoutMs);
  return { cleared: !!res?.data?.ok, reason: res?.error || null };
}
