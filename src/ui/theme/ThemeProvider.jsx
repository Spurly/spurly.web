import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './ThemeContext.js';

export const THEME_KEY = 'spurly.theme';
const ORDER = ['light', 'dark', 'system'];

/**
 * Reading and writing localStorage both throw in a private window with
 * site data blocked, and reading can return null in previews. Neither
 * is worth a broken app, so both are wrapped and the theme silently
 * falls back to the OS preference.
 */
function readStored() {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return ORDER.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(THEME_KEY, value);
  } catch {
    /* private window, or site data blocked. The choice just won't survive a reload. */
  }
}

const darkQuery = () =>
  (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null);

/**
 * Theme state, and the one place that writes `data-theme` on <html>.
 *
 * The attribute is written for an explicit choice and REMOVED for
 * 'system'. That is not a detail — tokens.css pairs
 * `@media (prefers-color-scheme: dark)` with
 * `:root:not([data-theme="light"])`, so the un-stamped document is
 * what lets the OS preference through. Stamping data-theme="light"
 * for a system-preference user would pin them to light on a dark OS.
 *
 * index.html runs the same logic inline before first paint. Keep the
 * two in step: if the storage key or the attribute contract changes
 * here, change it there too, or a dark-mode user gets a white flash
 * on every reload.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored);
  const [systemDark, setSystemDark] = useState(() => Boolean(darkQuery()?.matches));

  /* Track the OS preference so `resolvedTheme` stays honest while the
     user sits on 'system' and their machine flips at sunset. */
  useEffect(() => {
    const q = darkQuery();
    if (!q) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    q.addEventListener('change', onChange);
    return () => q.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!ORDER.includes(next)) return;
    setThemeState(next);
    writeStored(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length];
      writeStored(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: theme === 'system' ? (systemDark ? 'dark' : 'light') : theme,
      setTheme,
      toggle,
    }),
    [theme, systemDark, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
