import { createContext } from 'react';

/**
 * Split from ThemeProvider.jsx for the same reason ToastContext is:
 * react-refresh/only-export-components. A file that exports both a
 * component and a non-component loses fast refresh for the component.
 *
 * Default is null; useTheme() falls back to light either way, with or
 * without a provider mounted.
 */
export const ThemeContext = createContext(null);
