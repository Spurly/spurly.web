import { useContext } from 'react';
import { ToastContext } from './ToastContext';

/**
 * Transient feedback for actions whose result isn't visible on screen.
 *
 *   const toast = useToast();
 *   toast.success('Campaign created');
 *   toast.error("Couldn't reach the extension", { action: { label: 'Retry', onClick: retry } });
 *
 * Falls back to a no-op outside a provider so a component is never crashed by
 * a missing provider — a missing toast is a smaller failure than a white screen.
 */
const NOOP = {
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  dismiss: () => {},
};

export function useToast() {
  return useContext(ToastContext) ?? NOOP;
}
