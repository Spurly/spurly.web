import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './ToastContext';
import { Toast } from './Toast';

const DEFAULT_DURATION = 4500;
const ERROR_DURATION = 7000; /* failures need longer — there's usually something to read */
const EXIT_MS = 140; /* must match .sp-toast-exit in index.css */
const MAX_VISIBLE = 3;

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
  const exitTimers = useRef(new Map());
  const nextId = useRef(0);

  const clearTimer = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  /* Two-phase removal: flag the toast as exiting so it can animate out, then
     drop it from state once the animation has run. Removing it immediately
     would make it disappear with no transition. */
  const dismiss = useCallback(
    (id) => {
      clearTimer(id);
      if (exitTimers.current.has(id)) return; /* already leaving */

      setToasts((list) => list.map((t) => (t.id === id ? { ...t, exiting: true } : t)));

      const exit = setTimeout(() => {
        exitTimers.current.delete(id);
        setToasts((list) => list.filter((t) => t.id !== id));
      }, EXIT_MS);
      exitTimers.current.set(id, exit);
    },
    [clearTimer],
  );

  const schedule = useCallback(
    (id, duration) => {
      if (duration === Infinity) return;
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  const show = useCallback(
    (message, options = {}) => {
      if (!message) return null;

      const id = ++nextId.current;
      const tone = options.tone ?? 'info';
      const toast = {
        id,
        message,
        tone,
        description: options.description,
        action: options.action,
        duration: options.duration ?? (tone === 'error' ? ERROR_DURATION : DEFAULT_DURATION),
        exiting: false,
      };

      setToasts((list) => {
        /* Collapse an identical message that is already on screen instead of
           stacking duplicates — a failing request retried three times should
           read as one problem, not three. */
        const duplicate = list.find(
          (t) => !t.exiting && t.message === message && t.tone === tone,
        );
        if (duplicate) {
          clearTimer(duplicate.id);
          schedule(duplicate.id, toast.duration);
          return list;
        }

        const next = [...list, toast];
        /* Trim the oldest non-exiting toasts past the cap. */
        const overflow = next.filter((t) => !t.exiting).length - MAX_VISIBLE;
        if (overflow <= 0) return next;

        let toDrop = overflow;
        return next.filter((t) => {
          if (toDrop > 0 && !t.exiting && t.id !== id) {
            toDrop -= 1;
            clearTimer(t.id);
            return false;
          }
          return true;
        });
      });

      schedule(id, toast.duration);
      return id;
    },
    [schedule, clearTimer],
  );

  const pause = useCallback((id) => clearTimer(id), [clearTimer]);

  const resume = useCallback(
    (id) => {
      const toast = toasts.find((t) => t.id === id);
      if (toast && !toast.exiting && !timers.current.has(id)) schedule(id, toast.duration);
    },
    [toasts, schedule],
  );

  /* Clear every pending timer if the provider itself unmounts. */
  useEffect(() => {
    const pending = timers.current;
    const exiting = exitTimers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
      exiting.forEach(clearTimeout);
      exiting.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, { ...options, tone: 'success' }),
      error: (message, options) => show(message, { ...options, tone: 'error' }),
      warning: (message, options) => show(message, { ...options, tone: 'warning' }),
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
            /* Top-centre. `inset-x-0` + `mx-auto` on a max-content column keeps
               the stack centred without a transform, so the entry animation can
               own transform outright and not fight a centring translate. */
            className="fixed top-4 inset-x-0 z-[1300] flex flex-col-reverse items-center gap-2 px-4 pointer-events-none"
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
