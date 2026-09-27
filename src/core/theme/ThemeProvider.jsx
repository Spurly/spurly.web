import { useMemo } from 'react';
import { ThemeContext } from './ThemeContext.js';

/**
 * Light is the only supported theme. There is no toggle, no stored
 * preference, and no OS-preference tracking — the app renders light
 * regardless of the device's dark-mode setting. This provider exists
 * only so `useTheme()` keeps working for any code that still reads
 * `resolvedTheme`.
 */
export function ThemeProvider({ children }) {
  const value = useMemo(
    () => ({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: () => {},
      toggle: () => {},
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
