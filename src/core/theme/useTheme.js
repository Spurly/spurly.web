import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.js';

/**
 * Light is the only theme the app supports. This hook always resolves
 * to light, with or without a provider — a missing provider is not a
 * security boundary, just a component rendered outside the app shell
 * (a test, a Storybook-ish harness).
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;

  return {
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: () => {},
    toggle: () => {},
  };
}
