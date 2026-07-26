import { useState, useEffect, useCallback } from 'react';
import { pingExtension } from 'src/core/extension/extensionBridge.js';

/**
 * Detects whether the Spurly extension is installed & enabled on this browser
 * (and whether it's logged in). Re-checkable so a "Enable the extension" prompt
 * can offer a "Recheck" button.
 */
export function useExtension() {
  const [state, setState] = useState({
    installed: false,
    loggedIn: false,
    version: null,
    checking: true,
  });

  const check = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }));
    const res = await pingExtension();
    setState({ ...res, checking: false });
    return res;
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { ...state, recheck: check };
}
