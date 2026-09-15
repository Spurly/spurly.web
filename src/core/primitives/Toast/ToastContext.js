import { createContext } from 'react';

/* Context lives in its own file so the provider module only exports components
   and stays eligible for fast refresh. */
export const ToastContext = createContext(null);
