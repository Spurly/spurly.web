import { createContext } from 'react';

/**
 * Split from ThemeProvider.jsx for the same reason ToastContext is:
 * react-refresh/only-export-components. A file that exports both a
 * component and a non-component loses fast refresh for the component.
 *
 * Default is null so useTheme can tell "no provider" apart from
 * "provider, system preference" — see useTheme.js for why that
 * distinction has to fail loudly rather than silently render light.
 */
export const ThemeContext = createContext(null);
