import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './ToastContext';
import { Toast } from './Toast';

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 4;

/**
 * Toast queue.
 *
 * Timers live in a ref keyed by id rather than inside each Toast, so hovering
 * one toast pauses only that toast, and unmounting always clears its timer —
 * a dangling setTimeout that calls setState after unmount is the classic leak
 * in hand-rolled toast systems.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback(
    (id, duration) => {
      if (duration === Infinity) return;
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const show = useCallback(
    (message, options = {}) => {
      const id = ++nextId.current;
      const toast = {
        id,
        message,
        tone: options.tone ?? 'info',
        description: options.description,
        action: options.action,
        duration: options.duration ?? DEFAULT_DURATION,
      };

      setToasts((list) => [...list, toast].slice(-MAX_VISIBLE));
      schedule(id, toast.duration);
      return id;
    },
    [schedule],
  );

  const pause = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const resume = useCallback(
    (id) => {
      const toast = toasts.find((t) => t.id === id);
      if (toast && !timers.current.has(id)) schedule(id, toast.duration);
    },
    [toasts, schedule],
  );

  /* Clear every pending timer if the provider itself unmounts. */
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, { ...options, tone: 'success' }),
      error: (message, options) => show(message, { ...options, tone: 'error' }),
      info: (message, options) => show(message, { ...options, tone: 'info' }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed bottom-4 right-4 flex flex-col-reverse gap-2 pointer-events-none"
            style={{ zIndex: 'var(--ui-z-toast)' }}
          >
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                toast={toast}
                onDismiss={() => dismiss(toast.id)}
                onPause={() => pause(toast.id)}
                onResume={() => resume(toast.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
