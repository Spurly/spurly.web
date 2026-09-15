import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.js';

/**
 * Theme, as chosen and as resolved.
 *
 *   theme          'light' | 'dark' | 'system'  — what the user picked
 *   resolvedTheme  'light' | 'dark'             — what is actually on screen
 *   setTheme(next)
 *   toggle()       cycles light -> dark -> system
 *
 * Unlike useSubscription, this does NOT throw without a provider.
 * A missing theme provider is not a security boundary — it is a
 * component rendered in a test or a Storybook-ish harness — and the
 * honest fallback is the OS preference, which is exactly what the
 * CSS does on its own when no data-theme attribute is present.
 * Throwing here would mean every primitive test needs a provider to
 * render a button.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;

  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    theme: 'system',
    resolvedTheme: prefersDark ? 'dark' : 'light',
    setTheme: () => {},
    toggle: () => {},
  };
}
