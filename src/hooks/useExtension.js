import { useState, useEffect, useCallback } from 'react';
import { pingExtension } from 'src/core/extension/extensionBridge.js';

/**
 * How long to wait before re-asking when the first ping went unanswered.
 *
 * An MV3 service worker is asleep most of the time, and the message that wakes
 * it is occasionally dropped rather than delivered — the worker starts, the
 * request never reaches it. The second ask lands on a worker that is already
 * awake, so it answers immediately.
 */
const RETRY_DELAY_MS = 800;

/**
 * Detects whether the Spurly extension is installed & enabled on this browser
 * (and whether it's logged in). Re-checkable so a "Enable the extension" prompt
 * can offer a "Recheck" button.
 *
 * `loggedIn` is only meaningful when `loginKnown` is true. A ping that times
 * out reports `loggedIn: false, loginKnown: false` — that is "the worker did
 * not answer", NOT "the user is signed out", and rendering the two the same
 * way is how a sleeping worker ends up accusing a signed-in user of being
 * signed out. This hook used to drop the flag on the floor.
 */
export function useExtension() {
  const [state, setState] = useState({
    installed: false,
    loggedIn: false,
    loginKnown: false,
    version: null,
    checking: true,
  });

  const check = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }));

    let res = await pingExtension();
    // Installed, but the worker did not answer in time: ask once more before
    // reporting an unknown state. Only when the extension is actually present
    // — there is nothing to wake otherwise, and a second timeout would just
    // double how long "Checking…" hangs for everyone without it installed.
    if (res.installed && !res.loginKnown) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      res = await pingExtension();
    }

    setState({ ...res, checking: false });
    return res;
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { ...state, recheck: check };
}
