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
  const res = await request(ACTIONS.START, { campaignId }, timeoutMs);
  if (!res) return { started: false, error: 'Extension did not respond' };
  if (!res.ok) return { started: false, error: describeBridgeError(res.error) };
  return res.data || { started: false, error: 'No response' };
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
  const res = await request(ACTIONS.ENRICH_START, {}, timeoutMs);
  if (!res) return { started: false, error: 'Extension did not respond' };
  if (!res.ok) return { started: false, error: describeBridgeError(res.error) };
  return res.data || { started: false, error: 'No response' };
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
  const res = await request(ACTIONS.SYNC_START, {}, timeoutMs);
  if (!res) return { started: false, error: 'Extension did not respond' };
  if (!res.ok) return { started: false, error: describeBridgeError(res.error) };
  return res.data || { started: false, error: 'No response' };
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
